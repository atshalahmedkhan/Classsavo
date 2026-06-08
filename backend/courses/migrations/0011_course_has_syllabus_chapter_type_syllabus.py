from django.db import migrations, models


def backfill_course_has_syllabus(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    Chapter = apps.get_model('courses', 'Chapter')
    for course in Course.objects.all():
        has_syllabus = Chapter.objects.filter(course_id=course.id).filter(
            models.Q(chapter_type='syllabus') | models.Q(title__icontains='syllabus')
        ).exists()
        if has_syllabus:
            course.has_syllabus = True
            course.save(update_fields=['has_syllabus'])


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0010_chapterfile_file_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='has_syllabus',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='chapter',
            name='chapter_type',
            field=models.CharField(
                choices=[
                    ('syllabus', 'Syllabus'),
                    ('reading', 'Reading'),
                    ('assignment', 'Assignment'),
                ],
                default='reading',
                max_length=20,
            ),
        ),
        migrations.RunPython(backfill_course_has_syllabus, migrations.RunPython.noop),
    ]
