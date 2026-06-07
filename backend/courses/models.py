import secrets

import string



from django.conf import settings

from django.db import models





def generate_access_code():

    alphabet = string.ascii_letters + string.digits

    return ''.join(secrets.choice(alphabet) for _ in range(8))





class Course(models.Model):

    title = models.CharField(max_length=255)

    description = models.TextField()

    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)

    instructor = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='courses_taught',

    )

    access_code = models.CharField(max_length=20, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)



    class Meta:

        ordering = ['-created_at']



    def __str__(self):

        return self.title



    def save(self, *args, **kwargs):

        if not self.access_code:

            code = generate_access_code()

            while Course.objects.filter(access_code=code).exclude(pk=self.pk).exists():

                code = generate_access_code()

            self.access_code = code

        super().save(*args, **kwargs)





class Chapter(models.Model):

    title = models.CharField(max_length=255)

    content = models.TextField(help_text='Plate.js JSON content')

    course = models.ForeignKey(

        Course,

        on_delete=models.CASCADE,

        related_name='chapters',

    )

    is_public = models.BooleanField(default=False)

    order = models.IntegerField(default=0)

    assignment_instructions = models.TextField(blank=True, default='')

    due_date = models.DateTimeField(null=True, blank=True)



    class Meta:

        ordering = ['order', 'id']



    def __str__(self):

        return f'{self.course.title} - {self.title}'





class ChapterFile(models.Model):

    chapter = models.ForeignKey(

        Chapter,

        on_delete=models.CASCADE,

        related_name='files',

    )

    file = models.FileField(upload_to='chapter_files/')

    preview_file = models.FileField(upload_to='chapter_files/previews/', null=True, blank=True)

    file_name = models.CharField(max_length=255)

    uploaded_at = models.DateTimeField(auto_now_add=True)



    class Meta:

        ordering = ['-uploaded_at']



    def __str__(self):

        return self.file_name





class ChapterProgress(models.Model):

    student = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='chapter_progress',

    )

    chapter = models.ForeignKey(

        Chapter,

        on_delete=models.CASCADE,

        related_name='progress_records',

    )

    time_spent_seconds = models.IntegerField(default=0)

    is_read = models.BooleanField(default=False)

    last_updated = models.DateTimeField(auto_now=True)



    class Meta:

        unique_together = ('student', 'chapter')

        ordering = ['-last_updated']



    def __str__(self):

        return f'{self.student.username} - {self.chapter.title}'





class Message(models.Model):

    sender = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='sent_messages',

    )

    receiver = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='received_messages',

    )

    course = models.ForeignKey(

        Course,

        on_delete=models.SET_NULL,

        null=True,

        blank=True,

        related_name='messages',

    )

    body = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)



    class Meta:

        ordering = ['created_at']



    def __str__(self):

        return f'{self.sender.username} -> {self.receiver.username}'





class Enrollment(models.Model):

    student = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='enrollments',

    )

    course = models.ForeignKey(

        Course,

        on_delete=models.CASCADE,

        related_name='enrollments',

    )

    enrolled_at = models.DateTimeField(auto_now_add=True)



    class Meta:

        unique_together = ('student', 'course')

        ordering = ['-enrolled_at']



    def __str__(self):

        return f'{self.student.username} enrolled in {self.course.title}'





class Notification(models.Model):

    class NotificationType(models.TextChoices):

        NEW_MESSAGE = 'new_message', 'New Message'

        NEW_CHAPTER = 'new_chapter', 'New Chapter'

        ASSIGNMENT_DUE = 'assignment_due', 'Assignment Due'



    recipient = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='notifications',

    )

    message = models.TextField()

    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    course = models.ForeignKey(

        Course,

        on_delete=models.CASCADE,

        null=True,

        blank=True,

        related_name='notifications',

    )

    chapter = models.ForeignKey(

        Chapter,

        on_delete=models.CASCADE,

        null=True,

        blank=True,

        related_name='notifications',

    )



    class Meta:

        ordering = ['-created_at']



    def __str__(self):

        return f'{self.recipient.username}: {self.notification_type}'


