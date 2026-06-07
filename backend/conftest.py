import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from courses.models import Chapter, Course, Enrollment
from tests.factories import (
    CourseFactory,
    InstructorFactory,
    StudentFactory,
)


@pytest.fixture
def api_client():
    return APIClient()


def auth_client(client, user):
    token = str(RefreshToken.for_user(user).access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


@pytest.fixture
def instructor_user(db):
    return InstructorFactory(password='pass12345')


@pytest.fixture
def student_user(db):
    return StudentFactory(password='pass12345')


@pytest.fixture
def other_instructor(db):
    return InstructorFactory(username='otherinstructor', password='pass12345')


@pytest.fixture
def course(instructor_user):
    return CourseFactory(instructor=instructor_user, title='Test Course', description='Course description')


@pytest.fixture
def public_chapter(course):
    return Chapter.objects.create(
        title='Public Chapter',
        content='[{"type":"p","children":[{"text":"Hello world"}]}]',
        course=course,
        is_public=True,
        order=1,
    )


@pytest.fixture
def private_chapter(course):
    return Chapter.objects.create(
        title='Private Chapter',
        content='[]',
        course=course,
        is_public=False,
        order=2,
    )


@pytest.fixture
def enrollment(student_user, course):
    return Enrollment.objects.create(student=student_user, course=course)


@pytest.fixture
def instructor_client(instructor_user):
    client = APIClient()
    return auth_client(client, instructor_user)


@pytest.fixture
def student_client(student_user):
    client = APIClient()
    return auth_client(client, student_user)


@pytest.fixture
def other_instructor_client(other_instructor):
    client = APIClient()
    return auth_client(client, other_instructor)


@pytest.fixture
def tiny_png():
    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new('RGB', (1, 1), color='red').save(buffer, format='PNG')
    buffer.seek(0)
    return SimpleUploadedFile('thumb.png', buffer.read(), content_type='image/png')
