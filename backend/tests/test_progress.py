import pytest
from rest_framework import status

from courses.models import ChapterProgress


@pytest.mark.django_db
class TestChapterProgressPost:
    def test_student_can_post_progress_to_enrolled_chapter(
        self, student_client, enrollment, public_chapter
    ):
        response = student_client.post(
            f'/api/chapters/{public_chapter.id}/progress/',
            {'time_spent_seconds': 60, 'is_read': False},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['time_spent_seconds'] == 60

    def test_progress_upserts_on_second_post(
        self, student_client, enrollment, public_chapter, student_user
    ):
        student_client.post(
            f'/api/chapters/{public_chapter.id}/progress/',
            {'time_spent_seconds': 30, 'is_read': False},
            format='json',
        )
        response = student_client.post(
            f'/api/chapters/{public_chapter.id}/progress/',
            {'time_spent_seconds': 90, 'is_read': True},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['time_spent_seconds'] == 90
        assert response.data['is_read'] is True
        assert ChapterProgress.objects.filter(
            student=student_user, chapter=public_chapter
        ).count() == 1

    def test_student_cannot_post_progress_to_unenrolled_chapter(
        self, student_client, public_chapter
    ):
        response = student_client.post(
            f'/api/chapters/{public_chapter.id}/progress/',
            {'time_spent_seconds': 10, 'is_read': False},
            format='json',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestStudentProgressGet:
    def test_get_student_progress_returns_correct_read_count_and_total_time(
        self, student_client, enrollment, public_chapter, private_chapter, student_user
    ):
        ChapterProgress.objects.create(
            student=student_user,
            chapter=public_chapter,
            time_spent_seconds=120,
            is_read=True,
        )
        response = student_client.get('/api/student/progress/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['summary']['chapters_read'] == 1
        assert response.data['summary']['total_chapters'] == 1
        assert response.data['summary']['total_active_seconds'] == 120


@pytest.mark.django_db
class TestInstructorProgressGet:
    def test_get_course_progress_returns_all_student_progress_for_instructor(
        self, instructor_client, enrollment, public_chapter, student_user
    ):
        ChapterProgress.objects.create(
            student=student_user,
            chapter=public_chapter,
            time_spent_seconds=45,
            is_read=False,
        )
        response = instructor_client.get(f'/api/courses/{enrollment.course_id}/progress/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['students']) == 1
        assert len(response.data['progress']) == 1

    def test_student_cannot_access_instructor_progress_endpoint(
        self, student_client, enrollment
    ):
        response = student_client.get(f'/api/courses/{enrollment.course_id}/progress/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
