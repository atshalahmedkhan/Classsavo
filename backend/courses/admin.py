from django.contrib import admin

from .models import Chapter, ChapterFile, Course, Enrollment


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'created_at')
    list_filter = ('instructor',)
    search_fields = ('title', 'description')
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'is_public', 'order')
    list_filter = ('is_public', 'course')


@admin.register(ChapterFile)
class ChapterFileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'chapter', 'uploaded_at')
    list_filter = ('chapter__course',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_at')
    list_filter = ('course',)
