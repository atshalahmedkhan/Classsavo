import pytest
from rest_framework import status

from courses.models import Notification
from tests.factories import StudentFactory


@pytest.mark.django_db
class TestNotificationCreation:
    def test_notification_created_when_new_message_received(
        self, student_client, enrollment, instructor_user
    ):
        student_client.post(
            f'/api/messages/{instructor_user.id}/',
            {'body': 'Trigger notification', 'course_id': enrollment.course_id},
            format='json',
        )
        assert Notification.objects.filter(
            recipient=instructor_user,
            notification_type=Notification.NotificationType.NEW_MESSAGE,
        ).exists()

    def test_notification_created_when_instructor_publishes_chapter(
        self, instructor_client, private_chapter, enrollment
    ):
        response = instructor_client.patch(
            f'/api/chapters/{private_chapter.id}/toggle-visibility/',
            {},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(
            recipient=enrollment.student,
            notification_type=Notification.NotificationType.NEW_CHAPTER,
            chapter=private_chapter,
        ).exists()


@pytest.mark.django_db
class TestNotificationEndpoints:
    @pytest.fixture
    def student_notification(self, student_user, course):
        return Notification.objects.create(
            recipient=student_user,
            message='Your assignment is due soon',
            notification_type=Notification.NotificationType.ASSIGNMENT_DUE,
            course=course,
        )

    @pytest.fixture
    def other_student_notification(self, course):
        other = StudentFactory(password='pass12345')
        return Notification.objects.create(
            recipient=other,
            message='Other user notification',
            notification_type=Notification.NotificationType.NEW_MESSAGE,
            course=course,
        )

    def test_get_notifications_returns_only_logged_in_users_notifications(
        self, student_client, student_user, student_notification, other_student_notification
    ):
        response = student_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK
        ids = [item['id'] for item in response.data]
        assert student_notification.id in ids
        assert other_student_notification.id not in ids

    def test_patch_notification_read_marks_single_notification_as_read(
        self, student_client, student_notification
    ):
        response = student_client.patch(f'/api/notifications/{student_notification.id}/read/')
        assert response.status_code == status.HTTP_200_OK
        student_notification.refresh_from_db()
        assert student_notification.is_read is True

    def test_patch_notifications_read_all_marks_all_as_read(
        self, student_client, student_user, course
    ):
        Notification.objects.create(
            recipient=student_user,
            message='One',
            notification_type=Notification.NotificationType.NEW_MESSAGE,
            course=course,
        )
        Notification.objects.create(
            recipient=student_user,
            message='Two',
            notification_type=Notification.NotificationType.NEW_MESSAGE,
            course=course,
        )
        response = student_client.patch('/api/notifications/read-all/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_read'] >= 2
        assert not Notification.objects.filter(recipient=student_user, is_read=False).exists()
