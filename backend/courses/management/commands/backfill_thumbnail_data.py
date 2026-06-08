from django.core.management.base import BaseCommand

from courses.models import Course
from courses.thumbnail_utils import persist_thumbnail_bytes


class Command(BaseCommand):
    help = 'Copy existing course thumbnail files into database storage.'

    def handle(self, *args, **options):
        updated = 0
        skipped = 0
        for course in Course.objects.exclude(thumbnail=''):
            if course.thumbnail_data:
                skipped += 1
                continue
            before = bool(course.thumbnail_data)
            persist_thumbnail_bytes(course)
            course.refresh_from_db()
            if course.thumbnail_data and not before:
                updated += 1
                self.stdout.write(f'Backfilled course {course.id}: {course.title}')
            else:
                skipped += 1
        self.stdout.write(self.style.SUCCESS(f'Done. Updated {updated}, skipped {skipped}.'))
