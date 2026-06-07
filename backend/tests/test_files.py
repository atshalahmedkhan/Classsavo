import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from courses.models import ChapterFile
from tests.factories import CourseFactory, StudentFactory

User = get_user_model()


@pytest.mark.django_db
class TestFileUpload:
    def test_instructor_can_upload_pdf_to_chapter(self, instructor_client, private_chapter):
        pdf = SimpleUploadedFile('notes.pdf', b'%PDF-1.4 test content', content_type='application/pdf')
        response = instructor_client.post(
            f'/api/chapters/{private_chapter.id}/upload/',
            {'file': pdf},
            format='multipart',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['file_name'] == 'notes.pdf'
        assert ChapterFile.objects.filter(chapter=private_chapter).exists()

    def test_instructor_can_upload_image_to_chapter(self, instructor_client, private_chapter, tiny_png):
        response = instructor_client.post(
            f'/api/chapters/{private_chapter.id}/upload/',
            {'file': tiny_png},
            format='multipart',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['file_name'] == 'thumb.png'

    def test_instructor_can_delete_uploaded_file(self, instructor_client, private_chapter):
        pdf = SimpleUploadedFile('delete-me.pdf', b'%PDF-1.4', content_type='application/pdf')
        upload = instructor_client.post(
            f'/api/chapters/{private_chapter.id}/upload/',
            {'file': pdf},
            format='multipart',
        )
        file_id = upload.data['id']
        response = instructor_client.delete(f'/api/chapter-files/{file_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ChapterFile.objects.filter(id=file_id).exists()

    def test_student_cannot_upload_files(self, student_client, public_chapter, enrollment):
        pdf = SimpleUploadedFile('blocked.pdf', b'%PDF-1.4', content_type='application/pdf')
        response = student_client.post(
            f'/api/chapters/{public_chapter.id}/upload/',
            {'file': pdf},
            format='multipart',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_docx_upload_stores_pdf_preview_when_conversion_succeeds(
        self, instructor_client, private_chapter, monkeypatch
    ):
        def fake_convert(_path):
            return b'%PDF-1.4 converted preview'

        monkeypatch.setattr('courses.views.convert_docx_to_pdf', fake_convert)
        docx = SimpleUploadedFile(
            'handout.docx',
            b'PK\x03\x04 fake docx content',
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        response = instructor_client.post(
            f'/api/chapters/{private_chapter.id}/upload/',
            {'file': docx},
            format='multipart',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['has_pdf_preview'] is True
        chapter_file = ChapterFile.objects.get(id=response.data['id'])
        assert chapter_file.preview_file

    def test_docx_preview_endpoint_serves_pdf(
        self, instructor_client, student_client, private_chapter, enrollment, monkeypatch
    ):
        private_chapter.is_public = True
        private_chapter.save(update_fields=['is_public'])

        def fake_convert(_path):
            return b'%PDF-1.4 converted preview'

        monkeypatch.setattr('courses.views.convert_docx_to_pdf', fake_convert)
        docx = SimpleUploadedFile(
            'handout.docx',
            b'PK\x03\x04 fake docx content',
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        upload = instructor_client.post(
            f'/api/chapters/{private_chapter.id}/upload/',
            {'file': docx},
            format='multipart',
        )
        chapter_file = ChapterFile.objects.get(id=upload.data['id'])
        response = student_client.get(f'/api/chapter-files/{chapter_file.id}/preview/')
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/pdf'
        body = b''.join(response.streaming_content)
        assert body.startswith(b'%PDF')


@pytest.mark.django_db
class TestFilePreview:
    @pytest.fixture
    def chapter_file(self, instructor_client, public_chapter):
        pdf = SimpleUploadedFile('preview.pdf', b'%PDF-1.4 preview', content_type='application/pdf')
        response = instructor_client.post(
            f'/api/chapters/{public_chapter.id}/upload/',
            {'file': pdf},
            format='multipart',
        )
        return ChapterFile.objects.get(id=response.data['id'])

    def test_preview_endpoint_returns_file_with_content_disposition_inline(
        self, student_client, enrollment, chapter_file
    ):
        response = student_client.get(f'/api/chapter-files/{chapter_file.id}/preview/')
        assert response.status_code == status.HTTP_200_OK
        assert 'inline' in response['Content-Disposition']

    def test_unenrolled_student_cannot_access_preview_endpoint_returns_404(
        self, chapter_file, public_chapter
    ):
        from rest_framework.test import APIClient

        from conftest import auth_client

        outsider = StudentFactory(password='pass12345')
        client = auth_client(APIClient(), outsider)
        response = client.get(f'/api/chapter-files/{chapter_file.id}/preview/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_enrolled_student_can_access_preview_on_public_chapter(
        self, student_client, enrollment, chapter_file
    ):
        response = student_client.get(f'/api/chapter-files/{chapter_file.id}/preview/')
        assert response.status_code == status.HTTP_200_OK
