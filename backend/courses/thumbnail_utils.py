import mimetypes

from .models import Course


def persist_thumbnail_bytes(course: Course) -> None:
    """Store uploaded thumbnail bytes in Postgres so images survive Render redeploys."""
    if not course.thumbnail:
        return
    try:
        with course.thumbnail.open('rb') as thumbnail_file:
            data = thumbnail_file.read()
    except (OSError, ValueError):
        return

    mime_type, _ = mimetypes.guess_type(course.thumbnail.name)
    mime_type = mime_type or 'image/jpeg'
    Course.objects.filter(pk=course.pk).update(
        thumbnail_data=data,
        thumbnail_mime_type=mime_type,
    )
    course.thumbnail_data = data
    course.thumbnail_mime_type = mime_type
