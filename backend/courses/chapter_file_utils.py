import mimetypes
import os

from .models import ChapterFile


def _guess_mime_type(filename: str) -> str:
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'


def persist_chapter_file_bytes(
    chapter_file: ChapterFile,
    *,
    file_bytes: bytes | None = None,
    uploaded_file=None,
    preview_bytes: bytes | None = None,
) -> None:
    """Store uploaded file bytes in Postgres so files survive Render redeploys."""
    data = file_bytes
    if data is None and uploaded_file is not None:
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        data = uploaded_file.read()
    if data is None and chapter_file.file:
        try:
            with chapter_file.file.open('rb') as file_handle:
                data = file_handle.read()
        except (OSError, ValueError):
            data = None

    preview_data = preview_bytes
    if preview_data is None and chapter_file.preview_file:
        try:
            with chapter_file.preview_file.open('rb') as preview_handle:
                preview_data = preview_handle.read()
        except (OSError, ValueError):
            preview_data = None

    updates: dict = {}
    if data:
        updates['file_data'] = data
        updates['file_mime_type'] = _guess_mime_type(chapter_file.file_name)
        chapter_file.file_data = data
        chapter_file.file_mime_type = updates['file_mime_type']
    if preview_data:
        updates['preview_data'] = preview_data
        chapter_file.preview_data = preview_data

    if updates:
        ChapterFile.objects.filter(pk=chapter_file.pk).update(**updates)


def get_preview_response_parts(chapter_file: ChapterFile) -> tuple[bytes, str, str] | None:
    download_name = f'{os.path.splitext(chapter_file.file_name)[0]}.pdf'
    if chapter_file.preview_data:
        return chapter_file.preview_data, 'application/pdf', download_name
    if chapter_file.preview_file:
        try:
            with chapter_file.preview_file.open('rb') as preview_handle:
                return preview_handle.read(), 'application/pdf', download_name
        except (OSError, ValueError):
            return None
    return None


def get_file_response_parts(chapter_file: ChapterFile) -> tuple[bytes, str, str] | None:
    if chapter_file.file_data:
        mime_type = chapter_file.file_mime_type or _guess_mime_type(chapter_file.file_name)
        return chapter_file.file_data, mime_type, chapter_file.file_name
    if chapter_file.file:
        try:
            with chapter_file.file.open('rb') as file_handle:
                data = file_handle.read()
            mime_type = _guess_mime_type(chapter_file.file_name)
            return data, mime_type, chapter_file.file_name
        except (OSError, ValueError):
            return None
    return None
