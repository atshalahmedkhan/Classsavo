from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Enrollment


class IsCourseInstructor(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.instructor == request.user


class IsChapterCourseInstructor(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.course.instructor == request.user


class CoursePermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_instructor

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.instructor == request.user


class ChapterPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_instructor:
            return obj.course.instructor == request.user
        if request.method in SAFE_METHODS:
            return obj.is_public and Enrollment.objects.filter(
                student=request.user,
                course=obj.course,
            ).exists()
        return False


class EnrollmentPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if view.action == 'create':
            return request.user.is_student
        if view.action == 'list':
            return True
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_instructor:
            return obj.course.instructor == request.user
        return obj.student == request.user


def user_can_access_chapter_file(user, chapter_file):
    chapter = chapter_file.chapter
    course = chapter.course
    if user.is_instructor and course.instructor == user:
        return True
    if user.is_student:
        return chapter.is_public and Enrollment.objects.filter(
            student=user,
            course=course,
        ).exists()
    return False
