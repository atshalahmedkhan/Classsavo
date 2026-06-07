import json

import pytest
from django.utils import timezone
from rest_framework import status

from courses.models import Chapter


PLATE_CONTENT = [
    {'type': 'p', 'children': [{'text': 'Plate.js paragraph content'}]},
]


@pytest.mark.django_db
class TestChapterCreate:
    def test_instructor_can_create_chapter_in_own_course(self, instructor_client, course):
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'New Chapter',
                'content': PLATE_CONTENT,
                'course': course.id,
                'is_public': False,
                'order': 3,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Chapter'

    def test_instructor_cannot_create_chapter_in_another_instructors_course(
        self, other_instructor_client, course
    ):
        response = other_instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Blocked Chapter',
                'content': PLATE_CONTENT,
                'course': course.id,
                'is_public': False,
                'order': 1,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestChapterVisibility:
    def test_instructor_can_toggle_is_public_on_chapter(self, instructor_client, private_chapter):
        assert private_chapter.is_public is False
        response = instructor_client.patch(
            f'/api/chapters/{private_chapter.id}/toggle-visibility/',
            {},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_public'] is True

    def test_multiple_chapters_can_be_public_at_once(self, instructor_client, course):
        ch1 = Chapter.objects.create(
            title='Chapter One',
            content='[]',
            course=course,
            is_public=True,
            order=0,
        )
        ch2_response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Chapter Two',
                'content': PLATE_CONTENT,
                'course': course.id,
                'is_public': True,
                'order': 1,
            },
            format='json',
        )
        assert ch2_response.status_code == status.HTTP_201_CREATED

        ch1.refresh_from_db()
        ch2 = Chapter.objects.get(id=ch2_response.data['id'])
        assert ch1.is_public is True
        assert ch2.is_public is True

        list_response = instructor_client.get(f'/api/chapters/?course={course.id}')
        public_ids = [item['id'] for item in list_response.data if item['is_public']]
        assert ch1.id in public_ids
        assert ch2.id in public_ids

    def test_student_can_only_see_public_chapters(
        self, student_client, enrollment, public_chapter, private_chapter
    ):
        response = student_client.get(f'/api/chapters/?course={enrollment.course_id}')
        assert response.status_code == status.HTTP_200_OK
        ids = [item['id'] for item in response.data]
        assert public_chapter.id in ids
        assert private_chapter.id not in ids

    def test_student_cannot_retrieve_private_chapter_by_id(
        self, student_client, enrollment, private_chapter
    ):
        response = student_client.get(f'/api/chapters/{private_chapter.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestChapterStudentWrite:
    def test_student_cannot_create_chapter(self, student_client, course):
        response = student_client.post(
            '/api/chapters/',
            {
                'title': 'Student Chapter',
                'content': PLATE_CONTENT,
                'course': course.id,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_update_chapter(self, student_client, public_chapter, enrollment):
        response = student_client.patch(
            f'/api/chapters/{public_chapter.id}/',
            {'title': 'Hacked'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_delete_chapter(self, student_client, public_chapter, enrollment):
        response = student_client.delete(f'/api/chapters/{public_chapter.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestChapterContent:
    def test_chapter_stores_platejs_json_content_correctly(self, instructor_client, course):
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'JSON Chapter',
                'content': PLATE_CONTENT,
                'course': course.id,
                'is_public': True,
                'order': 1,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['content'] == PLATE_CONTENT
        chapter = Chapter.objects.get(id=response.data['id'])
        assert json.loads(chapter.content) == PLATE_CONTENT

    def test_chapter_assignment_instructions_and_due_date_save_and_return(
        self, instructor_client, course
    ):
        due = timezone.now() + timezone.timedelta(days=7)
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Assignment Chapter',
                'content': PLATE_CONTENT,
                'course': course.id,
                'is_public': True,
                'order': 1,
                'assignment_instructions': 'Complete the reading.',
                'due_date': due.isoformat(),
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['assignment_instructions'] == 'Complete the reading.'
        assert response.data['due_date'] is not None
