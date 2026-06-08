import mimetypes
import os

from django.conf import settings
from django.core.files.base import ContentFile
from django.http import FileResponse, Http404, HttpResponse
from django.shortcuts import get_object_or_404
from groq import Groq
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStudent

from .file_conversion import convert_docx_to_pdf
from .models import Chapter, ChapterFile, ChapterProgress, Course, Enrollment
from .plate_utils import extract_plain_text_from_plate
from .notification_services import check_assignment_due_notifications, create_chapter_published_notifications
from .permissions import (
    ChapterPermission,
    CoursePermission,
    EnrollmentPermission,
    user_can_access_chapter_file,
)
from .serializers import (
    ChapterFileSerializer,
    ChapterProgressSerializer,
    ChapterProgressUpdateSerializer,
    ChapterSerializer,
    CourseCreateUpdateSerializer,
    CourseJoinSerializer,
    CourseSerializer,
    EnrollmentListSerializer,
    EnrollmentSerializer,
)

ALLOWED_FILE_EXTENSIONS = {'.pdf', '.docx', '.png', '.jpg', '.jpeg'}


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [CoursePermission]

    def get_queryset(self):
        user = self.request.user
        if user.is_instructor:
            return Course.objects.filter(instructor=user)
        return Course.objects.all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save(instructor=request.user)
        course.refresh_from_db()
        output = CourseSerializer(course, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        course.refresh_from_db()
        output = CourseSerializer(course, context={'request': request})
        return Response(output.data)

    @action(
        detail=True,
        methods=['get'],
        url_path='thumbnail',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def thumbnail(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        if course.thumbnail_data:
            response = HttpResponse(course.thumbnail_data, content_type=course.thumbnail_mime_type or 'image/jpeg')
            response['Cache-Control'] = 'public, max-age=86400'
            return response
        if course.thumbnail:
            try:
                file_handle = course.thumbnail.open('rb')
            except (OSError, ValueError):
                raise Http404 from None
            content_type, _ = mimetypes.guess_type(course.thumbnail.name)
            return FileResponse(file_handle, content_type=content_type or 'image/jpeg')
        raise Http404

    @action(detail=True, methods=['get'], url_path='enrollments')
    def enrollments(self, request, pk=None):
        course = self.get_object()
        if not request.user.is_instructor or course.instructor != request.user:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        enrollments = course.enrollments.select_related('student')
        serializer = EnrollmentListSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='join', permission_classes=[IsAuthenticated, IsStudent])
    def join(self, request, pk=None):
        course = self.get_object()
        serializer = CourseJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_code = serializer.validated_data['access_code']

        if access_code != course.access_code:
            return Response({'detail': 'Invalid access code'}, status=status.HTTP_403_FORBIDDEN)

        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': 'You are already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

        enrollment = Enrollment.objects.create(student=request.user, course=course)
        output = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='progress')
    def progress(self, request, pk=None):
        course = self.get_object()
        if not request.user.is_instructor or course.instructor != request.user:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        chapters = list(
            course.chapters.filter(is_public=True).order_by('order', 'id').values('id', 'title', 'order'),
        )
        enrollments = course.enrollments.select_related('student')
        students = [
            {
                'id': e.student.id,
                'username': e.student.username,
                'first_name': e.student.first_name,
                'last_name': e.student.last_name,
                'email': e.student.email,
            }
            for e in enrollments
        ]
        progress_records = ChapterProgress.objects.filter(
            chapter__course=course,
            chapter__is_public=True,
        ).select_related('student', 'chapter')
        progress = [
            {
                'student_id': record.student_id,
                'chapter_id': record.chapter_id,
                'time_spent_seconds': record.time_spent_seconds,
                'is_read': record.is_read,
            }
            for record in progress_records
        ]
        return Response({
            'students': students,
            'chapters': chapters,
            'progress': progress,
        })


class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    permission_classes = [ChapterPermission]

    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')

        if user.is_instructor:
            queryset = Chapter.objects.filter(course__instructor=user).prefetch_related('files')
        else:
            enrolled_course_ids = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
            queryset = Chapter.objects.filter(
                course_id__in=enrolled_course_ids,
                is_public=True,
            ).prefetch_related('files')

        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if course.instructor != self.request.user:
            raise PermissionDenied('You can only add chapters to your own courses.')
        serializer.save()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_instructor and instance.course.instructor != request.user:
            raise PermissionDenied('You can only edit chapters in your own courses.')
        was_public = instance.is_public
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        if instance.is_public and not was_public:
            create_chapter_published_notifications(instance)
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.course.instructor != request.user:
            raise PermissionDenied('You can only delete chapters in your own courses.')
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], url_path='toggle-visibility')
    def toggle_visibility(self, request, pk=None):
        chapter = self.get_object()
        if chapter.course.instructor != request.user:
            raise PermissionDenied('You can only toggle visibility on your own chapters.')
        was_public = chapter.is_public
        chapter.is_public = not chapter.is_public
        chapter.save(update_fields=['is_public'])
        if chapter.is_public and not was_public:
            create_chapter_published_notifications(chapter)
        serializer = self.get_serializer(chapter)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload')
    def upload(self, request, pk=None):
        chapter = self.get_object()
        if chapter.course.instructor != request.user:
            raise PermissionDenied('You can only upload files to your own chapters.')

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            raise ValidationError({'file': 'No file provided.'})

        extension = os.path.splitext(uploaded_file.name)[1].lower()
        if extension not in ALLOWED_FILE_EXTENSIONS:
            raise ValidationError({'file': 'Unsupported file type. Allowed: PDF, DOCX, PNG, and JPG.'})

        chapter_file = ChapterFile.objects.create(
            chapter=chapter,
            file=uploaded_file,
            file_name=uploaded_file.name,
        )

        if extension == '.docx':
            pdf_bytes = convert_docx_to_pdf(chapter_file.file.path)
            if pdf_bytes:
                preview_name = f'{os.path.splitext(uploaded_file.name)[0]}.pdf'
                chapter_file.preview_file.save(preview_name, ContentFile(pdf_bytes), save=True)

        serializer = ChapterFileSerializer(chapter_file, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['post'],
        url_path='progress',
        permission_classes=[IsAuthenticated, IsStudent],
    )
    def update_progress(self, request, pk=None):
        chapter = self.get_object()
        if not chapter.is_public:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not Enrollment.objects.filter(student=request.user, course=chapter.course).exists():
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChapterProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        progress, _ = ChapterProgress.objects.get_or_create(
            student=request.user,
            chapter=chapter,
        )
        progress.time_spent_seconds = max(progress.time_spent_seconds, data['time_spent_seconds'])
        if data.get('is_read'):
            progress.is_read = True
        progress.save()

        check_assignment_due_notifications(request.user)

        output = ChapterProgressSerializer(progress)
        return Response(output.data)


class ChapterFileViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = ChapterFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if self.action == 'destroy':
            return ChapterFile.objects.filter(chapter__course__instructor=user)
        if user.is_instructor:
            return ChapterFile.objects.filter(chapter__course__instructor=user)
        enrolled_course_ids = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
        return ChapterFile.objects.filter(
            chapter__course_id__in=enrolled_course_ids,
            chapter__is_public=True,
        )

    @action(detail=True, methods=['get'], url_path='preview')
    def preview(self, request, pk=None):
        chapter_file = self.get_object()
        if not user_can_access_chapter_file(request.user, chapter_file):
            raise PermissionDenied('You do not have access to this file.')

        if chapter_file.preview_file:
            file_handle = chapter_file.preview_file.open('rb')
            content_type = 'application/pdf'
            download_name = f'{os.path.splitext(chapter_file.file_name)[0]}.pdf'
        else:
            file_handle = chapter_file.file.open('rb')
            content_type, _ = mimetypes.guess_type(chapter_file.file_name)
            if not content_type:
                content_type = 'application/octet-stream'
            download_name = chapter_file.file_name

        response = FileResponse(file_handle, content_type=content_type, as_attachment=False)
        response['Content-Disposition'] = f'inline; filename="{download_name}"'
        return response

    def perform_destroy(self, instance):
        if instance.chapter.course.instructor != self.request.user:
            raise PermissionDenied('You can only delete files from your own chapters.')
        if instance.preview_file:
            instance.preview_file.delete(save=False)
        instance.file.delete(save=False)
        instance.delete()


class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [EnrollmentPermission]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_instructor:
            return Enrollment.objects.filter(course__instructor=user).select_related('student', 'course')
        return Enrollment.objects.filter(student=user).select_related('course', 'course__instructor')

    def get_serializer_class(self):
        if self.action == 'list' and self.request.user.is_instructor:
            return EnrollmentListSerializer
        return EnrollmentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if request.user.is_instructor:
            course_id = request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course_id=course_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


MAX_AI_CHAT_HISTORY = 20


class AIChatView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        message = (request.data.get('message') or '').strip()
        chapter_id = request.data.get('chapter_id')
        history = request.data.get('history') or []

        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if chapter_id is None:
            return Response({'detail': 'chapter_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.GROQ_API_KEY:
            return Response(
                {'detail': 'AI tutor is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        chapter = get_object_or_404(Chapter, pk=chapter_id)
        if not chapter.is_public:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not Enrollment.objects.filter(student=request.user, course=chapter.course).exists():
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        chapter_text = extract_plain_text_from_plate(chapter.content)
        system_prompt = (
            f"You are a helpful tutor for a course chapter titled '{chapter.title}'. "
            f"Here is the chapter content: {chapter_text}. "
            "Answer the student's questions based on this material. "
            "Be concise, friendly, and educational."
        )

        groq_messages = [{'role': 'system', 'content': system_prompt}]
        if isinstance(history, list):
            for item in history[-MAX_AI_CHAT_HISTORY:]:
                if not isinstance(item, dict):
                    continue
                role = item.get('role')
                content = (item.get('content') or '').strip()
                if role in ('user', 'assistant') and content:
                    groq_messages.append({'role': role, 'content': content})
        groq_messages.append({'role': 'user', 'content': message})

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            completion = client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=groq_messages,
            )
            response_text = completion.choices[0].message.content or ''
        except Exception:
            return Response(
                {'detail': 'Unable to get a response from the AI tutor. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'response': response_text})
