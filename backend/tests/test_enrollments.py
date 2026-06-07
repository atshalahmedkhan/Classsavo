import pytest
from rest_framework import status

from courses.models import Enrollment


@pytest.mark.django_db
class TestEnrollmentJoin:
    def test_student_can_join_course_with_correct_access_code(
        self, student_client, student_user, course
    ):
        response = student_client.post(
            f'/api/courses/{course.id}/join/',
            {'access_code': course.access_code},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert Enrollment.objects.filter(student=student_user, course=course).exists()

    def test_student_cannot_join_with_wrong_access_code_returns_403(
        self, student_client, course
    ):
        response = student_client.post(
            f'/api/courses/{course.id}/join/',
            {'access_code': 'wrongcode'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_join_same_course_twice_returns_400(
        self, student_client, enrollment
    ):
        response = student_client.post(
            f'/api/courses/{enrollment.course_id}/join/',
            {'access_code': enrollment.course.access_code},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_instructor_cannot_join_course(self, instructor_client, course):
        response = instructor_client.post(
            f'/api/courses/{course.id}/join/',
            {'access_code': course.access_code},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAccessCodeVisibility:
    def test_access_code_hidden_from_student_in_api_response(self, student_client, course):
        response = student_client.get(f'/api/courses/{course.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data.get('access_code') is None

    def test_access_code_visible_to_course_instructor(self, instructor_client, course):
        response = instructor_client.get(f'/api/courses/{course.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['access_code'] == course.access_code


@pytest.mark.django_db
class TestInstructorEnrollmentList:
    def test_instructor_enrollment_list_includes_course_for_analytics(
        self, instructor_client, enrollment
    ):
        response = instructor_client.get('/api/enrollments/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        record = next(item for item in response.data if item['id'] == enrollment.id)
        assert record['course']['id'] == enrollment.course_id
        assert record['course']['title'] == enrollment.course.title
