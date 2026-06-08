import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('courses', '0011_course_has_syllabus_chapter_type_syllabus'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssignmentSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('submitted_image', models.FileField(upload_to='submissions/')),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('annotated_image', models.ImageField(blank=True, null=True, upload_to='annotations/')),
                ('instructor_remarks', models.TextField(blank=True, default='')),
                ('score', models.IntegerField(blank=True, null=True)),
                (
                    'status',
                    models.CharField(
                        choices=[('submitted', 'Submitted'), ('reviewed', 'Reviewed')],
                        default='submitted',
                        max_length=20,
                    ),
                ),
                ('returned_at', models.DateTimeField(blank=True, null=True)),
                (
                    'chapter',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='assignment_submissions',
                        to='courses.chapter',
                    ),
                ),
                (
                    'student',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='assignment_submissions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-submitted_at'],
                'unique_together': {('student', 'chapter')},
            },
        ),
    ]
