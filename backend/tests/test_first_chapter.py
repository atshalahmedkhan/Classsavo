import pytest
from rest_framework import status

from courses.models import Chapter


@pytest.mark.django_db
class TestFirstChapterEndpoint:
    def test_returns_first_public_non_syllabus_chapter(
        self, instructor_client, student_client, course, enrollment
    ):
        Chapter.objects.create(
            title='Course Syllabus',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.SYLLABUS,
            is_public=True,
            order=0,
        )
        reading = Chapter.objects.create(
            title='Week 1 Reading',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.READING,
            is_public=True,
            order=1,
        )

        response = student_client.get(f'/api/courses/{course.id}/first-chapter/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['chapter_id'] == reading.id
        assert response.data['title'] == 'Week 1 Reading'
        assert response.data['type'] == 'reading'

    def test_returns_404_when_only_syllabus_is_public(
        self, instructor_client, student_client, course, enrollment
    ):
        Chapter.objects.create(
            title='Syllabus',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.SYLLABUS,
            is_public=True,
            order=0,
        )

        response = student_client.get(f'/api/courses/{course.id}/first-chapter/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unenrolled_student_gets_404(self, student_client, course):
        Chapter.objects.create(
            title='Week 1',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.READING,
            is_public=True,
            order=1,
        )

        response = student_client.get(f'/api/courses/{course.id}/first-chapter/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_skips_syllabus_by_title(self, student_client, course, enrollment):
        Chapter.objects.create(
            title='Fall 2026 Syllabus Overview',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.READING,
            is_public=True,
            order=0,
        )
        assignment = Chapter.objects.create(
            title='Homework 1',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.ASSIGNMENT,
            is_public=True,
            order=1,
        )

        response = student_client.get(f'/api/courses/{course.id}/first-chapter/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['chapter_id'] == assignment.id
        assert response.data['type'] == 'assignment'
