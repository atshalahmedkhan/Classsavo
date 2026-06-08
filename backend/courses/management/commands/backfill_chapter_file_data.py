from django.core.management.base import BaseCommand

from courses.chapter_file_utils import persist_chapter_file_bytes
from courses.models import ChapterFile


class Command(BaseCommand):
    help = 'Copy existing chapter files from disk into database storage.'

    def handle(self, *args, **options):
        updated = 0
        skipped = 0
        for chapter_file in ChapterFile.objects.all():
            needs_file = bool(chapter_file.file) and not chapter_file.file_data
            needs_preview = bool(chapter_file.preview_file) and not chapter_file.preview_data
            if not needs_file and not needs_preview:
                skipped += 1
                continue

            before_file = bool(chapter_file.file_data)
            before_preview = bool(chapter_file.preview_data)
            persist_chapter_file_bytes(chapter_file)
            chapter_file.refresh_from_db()

            if (chapter_file.file_data and not before_file) or (
                chapter_file.preview_data and not before_preview
            ):
                updated += 1
                self.stdout.write(f'Backfilled file {chapter_file.id}: {chapter_file.file_name}')
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f'Done. Updated {updated}, skipped {skipped}.'))
