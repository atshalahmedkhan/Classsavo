from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q

from courses.models import Chapter, ChapterFile, Course, Enrollment

User = get_user_model()

TITLE_PATTERNS = (
    'Course 0',
    'Idle Course',
    'Nav Course',
    'Course created for automated tests',
    'Test',
)


def build_test_course_queryset():
    title_filters = Q()
    for pattern in TITLE_PATTERNS:
        title_filters |= Q(title__icontains=pattern)

    return Course.objects.filter(
        title_filters
        | Q(description__icontains='Course created for automated tests')
        | Q(instructor__username='Test')
    ).distinct()


class Command(BaseCommand):
    help = 'Delete courses created by automated tests and their related data.'

    def handle(self, *args, **options):
        courses = list(build_test_course_queryset())
        if not courses:
            self.stdout.write(self.style.SUCCESS('No test courses found.'))
            return

        course_ids = [course.id for course in courses]
        chapter_ids = list(
            Chapter.objects.filter(course_id__in=course_ids).values_list('id', flat=True),
        )
        chapter_count = len(chapter_ids)
        file_count = ChapterFile.objects.filter(chapter_id__in=chapter_ids).count()
        enrollment_count = Enrollment.objects.filter(course_id__in=course_ids).count()

        deleted_titles = []
        for course in courses:
            deleted_titles.append(course.title)
            if course.thumbnail:
                course.thumbnail.delete(save=False)
            for chapter_file in ChapterFile.objects.filter(chapter__course=course):
                if chapter_file.preview_file:
                    chapter_file.preview_file.delete(save=False)
                chapter_file.file.delete(save=False)
            course.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Deleted {len(deleted_titles)} test course(s), '
                f'{chapter_count} chapter(s), {enrollment_count} enrollment(s), '
                f'and {file_count} chapter file(s).',
            ),
        )
        for title in deleted_titles:
            self.stdout.write(f'  - {title}')
