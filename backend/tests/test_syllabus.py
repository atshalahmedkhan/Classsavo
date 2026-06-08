import pytest
from rest_framework import status

from courses.models import Chapter, Course

PLATE_CONTENT = [{'type': 'p', 'children': [{'text': 'Syllabus content'}]}]


@pytest.mark.django_db
class TestSyllabusRequirement:
    def test_cannot_create_reading_without_syllabus(self, instructor_client, instructor_user):
        course = Course.objects.create(
            title='No Syllabus Course',
            description='Needs syllabus first',
            instructor=instructor_user,
            access_code='nosyll01',
            has_syllabus=False,
        )
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Week 1 Reading',
                'content': PLATE_CONTENT,
                'course': course.id,
                'chapter_type': 'reading',
                'is_public': False,
                'order': 0,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'syllabus' in response.data['error'].lower()

    def test_can_create_syllabus_chapter_first(self, instructor_client, instructor_user):
        course = Course.objects.create(
            title='New Course',
            description='Fresh course',
            instructor=instructor_user,
            access_code='newsyl01',
            has_syllabus=False,
        )
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Course Syllabus',
                'content': PLATE_CONTENT,
                'course': course.id,
                'chapter_type': 'syllabus',
                'is_public': True,
                'order': 0,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        course.refresh_from_db()
        assert course.has_syllabus is True

    def test_title_containing_syllabus_sets_has_syllabus(self, instructor_client, instructor_user):
        course = Course.objects.create(
            title='Another Course',
            description='Title match',
            instructor=instructor_user,
            access_code='syltitle',
            has_syllabus=False,
        )
        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Fall 2026 Syllabus Overview',
                'content': PLATE_CONTENT,
                'course': course.id,
                'chapter_type': 'reading',
                'is_public': True,
                'order': 0,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        course.refresh_from_db()
        assert course.has_syllabus is True

    def test_after_syllabus_can_create_reading(self, instructor_client, instructor_user):
        course = Course.objects.create(
            title='Ready Course',
            description='Has syllabus',
            instructor=instructor_user,
            access_code='readysyl',
            has_syllabus=False,
        )
        Chapter.objects.create(
            title='Syllabus',
            content='[]',
            course=course,
            chapter_type=Chapter.ChapterType.SYLLABUS,
            is_public=True,
            order=0,
        )
        course.has_syllabus = True
        course.save(update_fields=['has_syllabus'])

        response = instructor_client.post(
            '/api/chapters/',
            {
                'title': 'Week 1',
                'content': PLATE_CONTENT,
                'course': course.id,
                'chapter_type': 'reading',
                'is_public': False,
                'order': 1,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
