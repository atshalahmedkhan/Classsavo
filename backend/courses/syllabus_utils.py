from .models import Chapter, Course

SYLLABUS_REQUIRED_ERROR = (
    'You must publish a syllabus chapter first before adding readings or assignments.'
)


def chapter_qualifies_as_syllabus(title: str, chapter_type: str) -> bool:
    return chapter_type == Chapter.ChapterType.SYLLABUS or 'syllabus' in title.lower()


def mark_course_has_syllabus_if_needed(chapter: Chapter) -> None:
    if not chapter_qualifies_as_syllabus(chapter.title, chapter.chapter_type):
        return
    if not chapter.course.has_syllabus:
        Course.objects.filter(pk=chapter.course_id).update(has_syllabus=True)
        chapter.course.has_syllabus = True
