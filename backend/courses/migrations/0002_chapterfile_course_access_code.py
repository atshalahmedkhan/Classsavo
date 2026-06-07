import secrets
import string

from django.db import migrations, models


def populate_access_codes(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    alphabet = string.ascii_letters + string.digits
    existing_codes = set()

    for course in Course.objects.all():
        while True:
            code = ''.join(secrets.choice(alphabet) for _ in range(8))
            if code not in existing_codes:
                course.access_code = code
                course.save(update_fields=['access_code'])
                existing_codes.add(code)
                break


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='access_code',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.RunPython(populate_access_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='course',
            name='access_code',
            field=models.CharField(max_length=20, unique=True),
        ),
        migrations.CreateModel(
            name='ChapterFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='chapter_files/')),
                ('file_name', models.CharField(max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('chapter', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='files', to='courses.chapter')),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
