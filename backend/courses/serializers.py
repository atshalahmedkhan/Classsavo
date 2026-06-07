import json
import os

from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Chapter, ChapterFile, ChapterProgress, Course, Enrollment, Message, Notification, generate_access_code

User = get_user_model()


class ChapterFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    has_pdf_preview = serializers.SerializerMethodField()

    class Meta:
        model = ChapterFile
        fields = ('id', 'chapter', 'file_name', 'uploaded_at', 'file_url', 'has_pdf_preview')
        read_only_fields = ('id', 'chapter', 'file_name', 'uploaded_at', 'file_url', 'has_pdf_preview')

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_has_pdf_preview(self, obj):
        return bool(obj.preview_file)


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    chapter_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    enrollment_count = serializers.SerializerMethodField()
    access_code = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id',
            'title',
            'description',
            'instructor',
            'created_at',
            'chapter_count',
            'is_enrolled',
            'enrollment_count',
            'access_code',
            'thumbnail_url',
        )
        read_only_fields = ('id', 'instructor', 'created_at')

    def get_thumbnail_url(self, obj):
        if not obj.thumbnail:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail.url

    def get_access_code(self, obj):
        user = self.context['request'].user
        if user.is_instructor and obj.instructor == user:
            return obj.access_code
        return None

    def get_chapter_count(self, obj):
        user = self.context['request'].user
        if user.is_instructor and obj.instructor == user:
            return obj.chapters.count()
        return obj.chapters.filter(is_public=True).count()

    def get_is_enrolled(self, obj):
        user = self.context['request'].user
        if not user.is_student:
            return False
        return Enrollment.objects.filter(student=user, course=obj).exists()

    def get_enrollment_count(self, obj):
        user = self.context['request'].user
        if user.is_instructor and obj.instructor == user:
            return obj.enrollments.count()
        return None


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    access_code = serializers.CharField(max_length=20, required=False, allow_blank=True)

    class Meta:
        model = Course
        fields = ('title', 'description', 'access_code', 'thumbnail')

    def validate_access_code(self, value):
        if not value:
            return value
        queryset = Course.objects.filter(access_code=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('This access code is already in use.')
        return value

    def create(self, validated_data):
        access_code = validated_data.pop('access_code', '') or ''
        if not access_code:
            access_code = generate_access_code()
            while Course.objects.filter(access_code=access_code).exists():
                access_code = generate_access_code()
        validated_data['access_code'] = access_code
        return super().create(validated_data)


class ChapterSerializer(serializers.ModelSerializer):
    files = ChapterFileSerializer(many=True, read_only=True)
    content = serializers.JSONField()

    class Meta:
        model = Chapter
        fields = (
            'id',
            'title',
            'content',
            'course',
            'is_public',
            'order',
            'assignment_instructions',
            'due_date',
            'files',
        )
        read_only_fields = ('id',)

    def validate_content(self, value):
        if not value:
            return '[]'
        try:
            parsed = json.loads(value) if isinstance(value, str) else value
        except (json.JSONDecodeError, TypeError) as exc:
            raise serializers.ValidationError('Content must be valid Plate.js JSON.') from exc
        if not isinstance(parsed, list):
            raise serializers.ValidationError('Content must be a JSON array of nodes.')
        return json.dumps(parsed)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data['content'] = json.loads(instance.content)
        except (json.JSONDecodeError, TypeError):
            data['content'] = []
        return data


class CourseJoinSerializer(serializers.Serializer):
    access_code = serializers.CharField(max_length=20)


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        write_only=True,
    )

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'course', 'course_id', 'enrolled_at')
        read_only_fields = ('id', 'student', 'enrolled_at')

    def validate(self, attrs):
        user = self.context['request'].user
        course = attrs.get('course')
        if course and Enrollment.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError({'course_id': 'You are already enrolled in this course.'})
        return attrs

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class EnrollmentListSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'course', 'enrolled_at')

    def get_course(self, obj):
        return {
            'id': obj.course_id,
            'title': obj.course.title,
        }


class ChapterProgressSerializer(serializers.ModelSerializer):
    chapter_id = serializers.IntegerField(source='chapter.id', read_only=True)
    course_id = serializers.IntegerField(source='chapter.course_id', read_only=True)

    class Meta:
        model = ChapterProgress
        fields = (
            'id',
            'chapter_id',
            'course_id',
            'time_spent_seconds',
            'is_read',
            'last_updated',
        )
        read_only_fields = ('id', 'last_updated')


class ChapterProgressUpdateSerializer(serializers.Serializer):
    time_spent_seconds = serializers.IntegerField(min_value=0)
    is_read = serializers.BooleanField(required=False, default=False)


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id',
            'sender',
            'receiver',
            'course',
            'body',
            'created_at',
            'is_read',
        )
        read_only_fields = ('id', 'sender', 'receiver', 'created_at', 'is_read')


class MessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=5000)
    course_id = serializers.IntegerField(required=False, allow_null=True)


class ConversationSerializer(serializers.Serializer):
    user = UserSerializer()
    last_message = serializers.CharField()
    last_message_at = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
    course_id = serializers.IntegerField(allow_null=True)
    course_title = serializers.CharField(allow_null=True, allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(read_only=True, allow_null=True)
    chapter_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = (
            'id',
            'message',
            'notification_type',
            'is_read',
            'created_at',
            'course_id',
            'chapter_id',
        )
        read_only_fields = fields


class StudentAssignmentSerializer(serializers.Serializer):
    chapter_id = serializers.IntegerField()
    chapter_title = serializers.CharField()
    course_id = serializers.IntegerField()
    course_name = serializers.CharField()
    assignment_instructions = serializers.CharField()
    due_date = serializers.DateTimeField(allow_null=True)
    is_read = serializers.BooleanField()
    time_spent_seconds = serializers.IntegerField()
    order = serializers.IntegerField()
