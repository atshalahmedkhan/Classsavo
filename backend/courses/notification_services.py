from datetime import timedelta

from django.utils import timezone

from .models import Chapter, Enrollment, Notification


def create_message_notification(message):
    sender_name = message.sender.first_name or message.sender.username
    Notification.objects.create(
        recipient=message.receiver,
        message=f'New message from {sender_name}',
        notification_type=Notification.NotificationType.NEW_MESSAGE,
        course=message.course,
    )


def create_chapter_published_notifications(chapter):
    enrollments = Enrollment.objects.filter(course=chapter.course).select_related('student')
    notifications = [
        Notification(
            recipient=enrollment.student,
            message=f'New chapter published: {chapter.title}',
            notification_type=Notification.NotificationType.NEW_CHAPTER,
            course=chapter.course,
            chapter=chapter,
        )
        for enrollment in enrollments
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


def check_assignment_due_notifications(student):
    now = timezone.now()
    window_end = now + timedelta(hours=24)
    enrolled_course_ids = Enrollment.objects.filter(student=student).values_list('course_id', flat=True)
    chapters = Chapter.objects.filter(
        course_id__in=enrolled_course_ids,
        is_public=True,
        due_date__isnull=False,
        due_date__gt=now,
        due_date__lte=window_end,
    )
    for chapter in chapters:
        already_notified = Notification.objects.filter(
            recipient=student,
            chapter=chapter,
            notification_type=Notification.NotificationType.ASSIGNMENT_DUE,
            created_at__gte=now - timedelta(hours=24),
        ).exists()
        if already_notified:
            continue
        Notification.objects.create(
            recipient=student,
            message=f'Assignment due soon: {chapter.title}',
            notification_type=Notification.NotificationType.ASSIGNMENT_DUE,
            course=chapter.course,
            chapter=chapter,
        )
