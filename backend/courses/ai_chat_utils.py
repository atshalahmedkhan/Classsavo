from __future__ import annotations

from django.utils import timezone
from pypdf import PdfReader

from .models import Chapter, ChapterFile
from .plate_utils import extract_plain_text_from_plate


def format_readable_datetime(value) -> str:
    if not value:
        return ''
    local_value = timezone.localtime(value)
    return local_value.strftime('%B %d, %Y at %I:%M %p').replace(' 0', ' ')


def _pdf_bytes_for_chapter_file(chapter_file: ChapterFile) -> bytes | None:
    if chapter_file.file_name.lower().endswith('.pdf'):
        if chapter_file.file_data:
            return chapter_file.file_data
        if chapter_file.file:
            try:
                with chapter_file.file.open('rb') as pdf_handle:
                    return pdf_handle.read()
            except (OSError, ValueError):
                pass
    if chapter_file.preview_data:
        return chapter_file.preview_data
    if chapter_file.preview_file:
        try:
            with chapter_file.preview_file.open('rb') as preview_handle:
                return preview_handle.read()
        except (OSError, ValueError):
            return None
    return None


def extract_text_from_pdf_bytes(data: bytes) -> str:
    if not data:
        return ''
    try:
        from io import BytesIO

        reader = PdfReader(BytesIO(data))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or '')
        return '\n'.join(pages).strip()
    except Exception:
        return ''


def extract_chapter_files_content(chapter: Chapter) -> tuple[str, str]:
    """Return (uploaded materials metadata, concatenated PDF text)."""
    instructor_username = chapter.course.instructor.username
    metadata_lines: list[str] = []
    extracted_chunks: list[str] = []

    for chapter_file in chapter.files.all():
        upload_date = format_readable_datetime(chapter_file.uploaded_at)
        metadata_lines.append(
            f"- '{chapter_file.file_name}' uploaded by {instructor_username} on {upload_date}"
        )

        pdf_bytes = _pdf_bytes_for_chapter_file(chapter_file)
        if not pdf_bytes:
            continue

        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
        if extracted_text:
            extracted_chunks.append(f"--- {chapter_file.file_name} ---\n{extracted_text}")

    metadata_text = '\n'.join(metadata_lines) if metadata_lines else 'No uploaded files.'
    extracted_files_text = '\n\n'.join(extracted_chunks).strip()
    return metadata_text, extracted_files_text


def build_ai_tutor_system_prompt(chapter: Chapter) -> str:
    chapter_text = extract_plain_text_from_plate(chapter.content)
    files_metadata, extracted_files_text = extract_chapter_files_content(chapter)

    chapter_type = chapter.get_chapter_type_display()
    visibility = 'public' if chapter.is_public else 'draft'
    created_at = getattr(chapter, 'created_at', None)
    created_line = (
        f'Chapter was created on {format_readable_datetime(created_at)}.'
        if created_at
        else ''
    )

    assignment_lines: list[str] = []
    if chapter.chapter_type == Chapter.ChapterType.ASSIGNMENT:
        if chapter.due_date:
            due_display = format_readable_datetime(chapter.due_date)
            assignment_lines.append(f'This is an assignment due on {due_display}.')
            if timezone.now() > chapter.due_date:
                assignment_lines.append('This assignment is currently overdue.')
        else:
            assignment_lines.append('This is an assignment with no due date set.')

    assignment_block = ' '.join(assignment_lines)
    if assignment_block:
        assignment_block = f'{assignment_block}\n'

    file_content_block = extracted_files_text or 'No readable PDF content was extracted from uploaded files.'

    return (
        f"You are a helpful tutor for a chapter titled '{chapter.title}' ({chapter_type}).\n"
        f"{assignment_block}"
        f"Chapter visibility: {visibility}.\n"
        f"{created_line}\n"
        f"\nUploaded materials:\n{files_metadata}\n"
        f"\nChapter content: {chapter_text or 'No chapter text content.'}\n"
        f"\nFile content: {file_content_block}\n"
        "\nAnswer student questions based on all of this material. "
        "Be concise, friendly, and educational. "
        "If the student asks you to explain or summarize the reading, "
        "do so based on the uploaded materials above. "
        "If asked about due dates, uploaded files, or who uploaded something, "
        "answer accurately from the metadata above."
    )
