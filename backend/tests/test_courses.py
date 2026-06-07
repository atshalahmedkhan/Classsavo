import pytest
from rest_framework import status

from courses.models import Course


@pytest.mark.django_db
class TestCourseCreate:
    def test_instructor_can_create_course(self, instructor_client, instructor_user):
        response = instructor_client.post(
            '/api/courses/',
            {'title': 'New Course', 'description': 'A brand new course'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Course'
        assert response.data['instructor']['id'] == instructor_user.id

    def test_student_cannot_create_course(self, student_client):
        response = student_client.post(
            '/api/courses/',
            {'title': 'Blocked', 'description': 'Should fail'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCourseUpdate:
    def test_instructor_can_edit_own_course(self, instructor_client, course):
        response = instructor_client.patch(
            f'/api/courses/{course.id}/',
            {'title': 'Updated Title'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Title'

    def test_instructor_cannot_edit_another_instructors_course(
        self, other_instructor_client, course
    ):
        response = other_instructor_client.patch(
            f'/api/courses/{course.id}/',
            {'title': 'Hacked'},
            format='json',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_edit_course(self, student_client, course):
        response = student_client.patch(
            f'/api/courses/{course.id}/',
            {'title': 'Hacked'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCourseDelete:
    def test_instructor_can_delete_own_course(self, instructor_client, course):
        course_id = course.id
        response = instructor_client.delete(f'/api/courses/{course_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Course.objects.filter(id=course_id).exists()


@pytest.mark.django_db
class TestCourseList:
    def test_student_sees_all_courses_on_list_endpoint(self, student_client, course):
        response = student_client.get('/api/courses/')
        assert response.status_code == status.HTTP_200_OK
        ids = [item['id'] for item in response.data]
        assert course.id in ids

    def test_instructor_only_sees_own_courses_on_list_endpoint(
        self, instructor_client, other_instructor, course
    ):
        other_course = Course.objects.create(
            title='Other Course',
            description='Other',
            instructor=other_instructor,
        )
        response = instructor_client.get('/api/courses/')
        assert response.status_code == status.HTTP_200_OK
        ids = [item['id'] for item in response.data]
        assert course.id in ids
        assert other_course.id not in ids


@pytest.mark.django_db
class TestCourseAccessCode:
    def test_course_created_with_auto_generated_8_character_access_code(self, instructor_client):
        response = instructor_client.post(
            '/api/courses/',
            {'title': 'Code Course', 'description': 'Has access code'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        course = Course.objects.get(id=response.data['id'])
        assert len(course.access_code) == 8


@pytest.mark.django_db
class TestCourseThumbnail:
    def test_course_thumbnail_upload_saves_correctly(self, instructor_client, course, tiny_png):
        response = instructor_client.patch(
            f'/api/courses/{course.id}/',
            {
                'title': course.title,
                'description': course.description,
                'thumbnail': tiny_png,
            },
            format='multipart',
        )
        assert response.status_code == status.HTTP_200_OK
        course.refresh_from_db()
        assert course.thumbnail
        assert response.data['thumbnail_url']
