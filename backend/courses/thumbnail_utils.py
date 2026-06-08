import mimetypes

from .models import Course


def persist_thumbnail_bytes(course: Course, uploaded_file=None) -> None:
    """Store uploaded thumbnail bytes in Postgres so images survive Render redeploys."""
    data = None
    mime_type = 'image/jpeg'

    if uploaded_file is not None:
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        data = uploaded_file.read()
        mime_type, _ = mimetypes.guess_type(getattr(uploaded_file, 'name', '') or '')
    elif course.thumbnail:
        try:
            with course.thumbnail.open('rb') as thumbnail_file:
                data = thumbnail_file.read()
            mime_type, _ = mimetypes.guess_type(course.thumbnail.name)
        except (OSError, ValueError):
            return

    if not data:
        return

    mime_type = mime_type or 'image/jpeg'
    Course.objects.filter(pk=course.pk).update(
        thumbnail_data=data,
        thumbnail_mime_type=mime_type,
    )
    course.thumbnail_data = data
    course.thumbnail_mime_type = mime_type
