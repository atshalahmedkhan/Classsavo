from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0009_chapter_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='chapterfile',
            name='file_data',
            field=models.BinaryField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='chapterfile',
            name='file_mime_type',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='chapterfile',
            name='preview_data',
            field=models.BinaryField(blank=True, null=True),
        ),
    ]
