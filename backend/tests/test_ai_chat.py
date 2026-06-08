from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status

from courses.ai_chat_utils import build_ai_tutor_system_prompt, extract_text_from_pdf_file
from courses.models import Chapter, ChapterFile


@pytest.mark.django_db
class TestAIChatUtils:
    def test_build_prompt_includes_chapter_metadata_and_files(self, public_chapter, instructor_user):
        public_chapter.chapter_type = Chapter.ChapterType.ASSIGNMENT
        public_chapter.due_date = timezone.now() + timedelta(days=3)
        public_chapter.save()

        ChapterFile.objects.create(
            chapter=public_chapter,
            file=SimpleUploadedFile('reading.pdf', b'%PDF-1.4', content_type='application/pdf'),
            file_name='reading.pdf',
        )

        prompt = build_ai_tutor_system_prompt(public_chapter)

        assert public_chapter.title in prompt
        assert 'Assignment' in prompt
        assert 'assignment due on' in prompt
        assert 'Chapter visibility: public' in prompt
        assert 'Chapter was created on' in prompt
        assert 'reading.pdf' in prompt
        assert instructor_user.username in prompt
        assert 'Hello world' in prompt

    def test_extract_text_from_pdf_file_returns_empty_on_invalid_pdf(self):
        bad_file = SimpleUploadedFile('bad.pdf', b'not-a-pdf', content_type='application/pdf')
        assert extract_text_from_pdf_file(bad_file) == ''


@pytest.mark.django_db
class TestAIChatView:
    @patch('courses.views.Groq')
    def test_ai_chat_returns_response(self, mock_groq, student_client, public_chapter, enrollment, settings):
        settings.GROQ_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_groq.return_value = mock_client
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content='Here is a helpful answer.'))]
        )

        response = student_client.post(
            '/api/courses/ai-chat/',
            {
                'message': 'Summarize this chapter',
                'chapter_id': public_chapter.id,
                'history': [],
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['response'] == 'Here is a helpful answer.'

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        system_message = call_kwargs['messages'][0]['content']
        assert public_chapter.title in system_message
        assert 'Hello world' in system_message

    def test_ai_chat_requires_enrollment(self, student_client, public_chapter, settings):
        settings.GROQ_API_KEY = 'test-key'
        response = student_client.post(
            '/api/courses/ai-chat/',
            {'message': 'Hello', 'chapter_id': public_chapter.id},
            format='json',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
