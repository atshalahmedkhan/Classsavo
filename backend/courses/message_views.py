from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStudent

from .models import Chapter, ChapterProgress, Course, Enrollment, Message
from .notification_services import check_assignment_due_notifications, create_message_notification
from .serializers import (
    ChapterProgressSerializer,
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    StudentAssignmentSerializer,
)

User = get_user_model()


def users_can_message(sender, receiver):
    if sender.id == receiver.id:
        return False
    if sender.is_instructor and receiver.is_student:
        return Enrollment.objects.filter(
            student=receiver,
            course__instructor=sender,
        ).exists()
    if sender.is_student and receiver.is_instructor:
        return Enrollment.objects.filter(
            student=sender,
            course__instructor=receiver,
        ).exists()
    return False


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        conversations = {}

        messages = Message.objects.filter(
            Q(sender=user) | Q(receiver=user),
        ).select_related('sender', 'receiver', 'course').order_by('-created_at')

        for message in messages:
            other = message.receiver if message.sender_id == user.id else message.sender
            if other.id in conversations:
                continue
            thread = Message.objects.filter(
                Q(sender=user, receiver=other) | Q(sender=other, receiver=user),
            )
            last = thread.order_by('-created_at').first()
            unread = thread.filter(sender=other, receiver=user, is_read=False).count()
            conversations[other.id] = {
                'user': other,
                'last_message': last.body if last else '',
                'last_message_at': last.created_at if last else message.created_at,
                'unread_count': unread,
                'course_id': last.course_id if last else message.course_id,
                'course_title': last.course.title if last and last.course else None,
            }

        if user.is_student:
            enrollments = Enrollment.objects.filter(student=user).select_related(
                'course', 'course__instructor',
            )
            for enrollment in enrollments:
                instructor = enrollment.course.instructor
                if instructor.id in conversations:
                    continue
                conversations[instructor.id] = {
                    'user': instructor,
                    'last_message': '',
                    'last_message_at': enrollment.enrolled_at,
                    'unread_count': 0,
                    'course_id': enrollment.course_id,
                    'course_title': enrollment.course.title,
                }
        elif user.is_instructor:
            enrollments = Enrollment.objects.filter(course__instructor=user).select_related(
                'student', 'course',
            )
            for enrollment in enrollments:
                student = enrollment.student
                if student.id in conversations:
                    continue
                conversations[student.id] = {
                    'user': student,
                    'last_message': '',
                    'last_message_at': enrollment.enrolled_at,
                    'unread_count': 0,
                    'course_id': enrollment.course_id,
                    'course_title': enrollment.course.title,
                }

        data = sorted(conversations.values(), key=lambda c: c['last_message_at'], reverse=True)
        serializer = ConversationSerializer(data, many=True)
        return Response(serializer.data)


class MessageThreadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        other = _get_other_user(user_id)
        if not users_can_message(request.user, other) and not users_can_message(other, request.user):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        thread = Message.objects.filter(
            Q(sender=request.user, receiver=other) | Q(sender=other, receiver=request.user),
        ).select_related('sender', 'receiver', 'course').order_by('created_at')
        serializer = MessageSerializer(thread, many=True)
        return Response(serializer.data)

    def post(self, request, user_id):
        other = _get_other_user(user_id)
        if not users_can_message(request.user, other):
            return Response({'detail': 'You cannot message this user.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = None
        course_id = serializer.validated_data.get('course_id')
        if course_id:
            course = Course.objects.filter(pk=course_id).first()
            if not course:
                return Response({'course_id': 'Course not found.'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            sender=request.user,
            receiver=other,
            course=course,
            body=serializer.validated_data['body'].strip(),
        )
        create_message_notification(message)
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class MessageMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        other = _get_other_user(user_id)
        updated = Message.objects.filter(
            sender=other,
            receiver=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'marked_read': updated})


class MessageUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread_count': count})


def _get_other_user(user_id):
    return get_object_or_404(User, pk=user_id)


class StudentProgressView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        enrolled_course_ids = Enrollment.objects.filter(student=request.user).values_list('course_id', flat=True)
        total_chapters = Chapter.objects.filter(
            course_id__in=enrolled_course_ids,
            is_public=True,
        ).count()

        records = ChapterProgress.objects.filter(
            student=request.user,
        ).select_related('chapter', 'chapter__course')
        chapters_read = records.filter(
            is_read=True,
            chapter__is_public=True,
            chapter__course_id__in=enrolled_course_ids,
        ).count()
        total_active_seconds = records.filter(
            chapter__course_id__in=enrolled_course_ids,
        ).aggregate(total=Sum('time_spent_seconds'))['total'] or 0

        courses_summary = []
        for enrollment in Enrollment.objects.filter(student=request.user).select_related('course'):
            course = enrollment.course
            course_total = Chapter.objects.filter(course=course, is_public=True).count()
            course_read = records.filter(
                is_read=True,
                chapter__course=course,
                chapter__is_public=True,
            ).count()
            courses_summary.append({
                'course_id': course.id,
                'course_title': course.title,
                'chapters_read': course_read,
                'total_chapters': course_total,
            })

        serializer = ChapterProgressSerializer(records, many=True)
        return Response({
            'records': serializer.data,
            'summary': {
                'chapters_read': chapters_read,
                'total_chapters': total_chapters,
                'total_active_seconds': total_active_seconds,
            },
            'courses': courses_summary,
        })


class StudentAssignmentsView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        enrolled_course_ids = Enrollment.objects.filter(student=request.user).values_list('course_id', flat=True)
        chapters = Chapter.objects.filter(
            course_id__in=enrolled_course_ids,
            is_public=True,
        ).filter(
            Q(assignment_instructions__gt='') | Q(due_date__isnull=False),
        ).select_related('course')

        progress_map = {
            progress.chapter_id: progress
            for progress in ChapterProgress.objects.filter(
                student=request.user,
                chapter__in=chapters,
            )
        }

        now = timezone.now()
        assignments = []
        for chapter in chapters:
            if not chapter.assignment_instructions.strip() and not chapter.due_date:
                continue
            progress = progress_map.get(chapter.id)
            assignments.append({
                'chapter_id': chapter.id,
                'chapter_title': chapter.title,
                'course_id': chapter.course_id,
                'course_name': chapter.course.title,
                'assignment_instructions': chapter.assignment_instructions,
                'due_date': chapter.due_date,
                'is_read': progress.is_read if progress else False,
                'time_spent_seconds': progress.time_spent_seconds if progress else 0,
                'order': chapter.order,
            })

        def sort_key(item):
            due = item['due_date']
            if not due:
                return (2, now)
            if due < now:
                return (0, due)
            return (1, due)

        assignments.sort(key=sort_key)
        serializer = StudentAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
