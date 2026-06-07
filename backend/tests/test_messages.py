import pytest
from rest_framework import status

from courses.models import Message, Notification


@pytest.mark.django_db
class TestMessaging:
    def test_student_can_send_message_to_instructor(
        self, student_client, enrollment, instructor_user
    ):
        response = student_client.post(
            f'/api/messages/{instructor_user.id}/',
            {'body': 'Hello instructor', 'course_id': enrollment.course_id},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert Message.objects.filter(
            sender__role='student',
            receiver=instructor_user,
            body='Hello instructor',
        ).exists()

    def test_instructor_can_reply_to_student(
        self, instructor_client, enrollment, student_user
    ):
        response = instructor_client.post(
            f'/api/messages/{student_user.id}/',
            {'body': 'Hello student', 'course_id': enrollment.course_id},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_message_thread_returns_messages_in_chronological_order(
        self, student_client, instructor_client, enrollment, instructor_user, student_user
    ):
        student_client.post(
            f'/api/messages/{instructor_user.id}/',
            {'body': 'First message', 'course_id': enrollment.course_id},
            format='json',
        )
        instructor_client.post(
            f'/api/messages/{student_user.id}/',
            {'body': 'Reply message', 'course_id': enrollment.course_id},
            format='json',
        )
        response = student_client.get(f'/api/messages/{instructor_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        bodies = [item['body'] for item in response.data]
        assert bodies == ['First message', 'Reply message']

    def test_user_cannot_read_another_users_message_thread(
        self, student_client, instructor_client, enrollment, instructor_user, student_user
    ):
        student_client.post(
            f'/api/messages/{instructor_user.id}/',
            {'body': 'Private thread', 'course_id': enrollment.course_id},
            format='json',
        )
        from tests.factories import StudentFactory
        from conftest import auth_client
        from rest_framework.test import APIClient

        other_student = StudentFactory(password='pass12345')
        other_client = auth_client(APIClient(), other_student)
        response = other_client.get(f'/api/messages/{instructor_user.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_sending_message_creates_notification_for_recipient(
        self, student_client, enrollment, instructor_user
    ):
        student_client.post(
            f'/api/messages/{instructor_user.id}/',
            {'body': 'Notify me', 'course_id': enrollment.course_id},
            format='json',
        )
        assert Notification.objects.filter(
            recipient=instructor_user,
            notification_type=Notification.NotificationType.NEW_MESSAGE,
        ).exists()

    def test_marking_messages_as_read_updates_is_read(
        self, student_client, instructor_client, enrollment, instructor_user, student_user
    ):
        instructor_client.post(
            f'/api/messages/{student_user.id}/',
            {'body': 'Unread message', 'course_id': enrollment.course_id},
            format='json',
        )
        response = student_client.patch(f'/api/messages/{instructor_user.id}/read/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_read'] >= 1
        assert not Message.objects.filter(
            receiver=student_user,
            sender=instructor_user,
            is_read=False,
        ).exists()

    def test_conversation_list_includes_enrolled_contacts_without_messages(
        self, student_client, instructor_client, enrollment, instructor_user, student_user
    ):
        student_response = student_client.get('/api/messages/')
        assert student_response.status_code == status.HTTP_200_OK
        assert any(item['user']['id'] == instructor_user.id for item in student_response.data)

        instructor_response = instructor_client.get('/api/messages/')
        assert instructor_response.status_code == status.HTTP_200_OK
        assert any(item['user']['id'] == student_user.id for item in instructor_response.data)
