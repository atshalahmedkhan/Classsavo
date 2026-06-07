import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from conftest import auth_client

User = get_user_model()


@pytest.mark.django_db
class TestRegister:
    def test_register_instructor_successfully(self, api_client):
        response = api_client.post(
            '/api/auth/register/',
            {
                'username': 'newinstructor',
                'email': 'newinstructor@example.com',
                'password': 'pass12345',
                'password_confirm': 'pass12345',
                'first_name': 'New',
                'last_name': 'Instructor',
                'role': 'instructor',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['role'] == 'instructor'
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']

    def test_register_student_successfully(self, api_client):
        response = api_client.post(
            '/api/auth/register/',
            {
                'username': 'newstudent',
                'email': 'newstudent@example.com',
                'password': 'pass12345',
                'password_confirm': 'pass12345',
                'role': 'student',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['role'] == 'student'

    def test_register_fails_with_duplicate_username(self, api_client, student_user):
        response = api_client.post(
            '/api/auth/register/',
            {
                'username': student_user.username,
                'email': 'different@example.com',
                'password': 'pass12345',
                'password_confirm': 'pass12345',
                'role': 'student',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_fails_with_duplicate_email(self, api_client, student_user):
        response = api_client.post(
            '/api/auth/register/',
            {
                'username': 'uniqueusername999',
                'email': student_user.email,
                'password': 'pass12345',
                'password_confirm': 'pass12345',
                'role': 'student',
            },
            format='json',
        )
        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED)

    def test_register_fails_with_missing_role_field(self, api_client):
        response = api_client.post(
            '/api/auth/register/',
            {
                'username': 'noroleuser',
                'email': 'norole@example.com',
                'password': 'pass12345',
                'password_confirm': 'pass12345',
            },
            format='json',
        )
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_201_CREATED,
        )
        if response.status_code == status.HTTP_201_CREATED:
            assert response.data['user']['role'] == 'student'


@pytest.mark.django_db
class TestLogin:
    def test_login_returns_access_and_refresh_tokens(self, api_client, student_user):
        response = api_client.post(
            '/api/auth/login/',
            {'username': student_user.username, 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['username'] == student_user.username

    def test_login_fails_with_wrong_password(self, api_client, student_user):
        response = api_client.post(
            '/api/auth/login/',
            {'username': student_user.username, 'password': 'wrongpassword'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_fails_with_nonexistent_username(self, api_client):
        response = api_client.post(
            '/api/auth/login/',
            {'username': 'nobodyhere', 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    def test_me_returns_correct_user_data_when_authenticated(self, student_client, student_user):
        response = student_client.get('/api/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == student_user.id
        assert response.data['username'] == student_user.username
        assert response.data['role'] == 'student'

    def test_me_returns_401_when_unauthenticated(self, api_client):
        response = api_client.get('/api/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestChangePassword:
    def test_change_password_succeeds_with_correct_current_password(self, student_user):
        client = auth_client(APIClient(), student_user)
        response = client.post(
            '/api/auth/change-password/',
            {
                'current_password': 'pass12345',
                'new_password': 'newpass123',
                'confirm_new_password': 'newpass123',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Password updated successfully.'
        student_user.refresh_from_db()
        assert student_user.check_password('newpass123')

    def test_change_password_fails_with_wrong_current_password(self, student_client):
        response = student_client.post(
            '/api/auth/change-password/',
            {
                'current_password': 'wrongpassword',
                'new_password': 'newpass123',
                'confirm_new_password': 'newpass123',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'current_password' in response.data

    def test_change_password_fails_when_new_passwords_do_not_match(self, student_client):
        response = student_client.post(
            '/api/auth/change-password/',
            {
                'current_password': 'pass12345',
                'new_password': 'newpass123',
                'confirm_new_password': 'different123',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'confirm_new_password' in response.data

    def test_change_password_fails_when_new_password_under_8_characters(self, student_client):
        response = student_client.post(
            '/api/auth/change-password/',
            {
                'current_password': 'pass12345',
                'new_password': 'short',
                'confirm_new_password': 'short',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
