from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .message_views import (
    MessageListView,
    MessageMarkReadView,
    MessageThreadView,
    MessageUnreadCountView,
    StudentAssignmentsView,
    StudentProgressView,
)
from .notification_views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
)
from .views import (
    AIChatView,
    ChapterFileViewSet,
    ChapterViewSet,
    CourseViewSet,
    EnrollmentViewSet,
    SubmissionAnnotatedFileView,
    SubmissionFeedbackView,
    SubmissionSubmittedFileView,
)

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('chapters', ChapterViewSet, basename='chapter')
router.register('chapter-files', ChapterFileViewSet, basename='chapter-file')
router.register('enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('student/progress/', StudentProgressView.as_view(), name='student-progress'),
    path('student/assignments/', StudentAssignmentsView.as_view(), name='student-assignments'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-read-all'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-read'),
    path('messages/unread-count/', MessageUnreadCountView.as_view(), name='message-unread-count'),
    path('messages/', MessageListView.as_view(), name='message-list'),
    path('messages/<int:user_id>/', MessageThreadView.as_view(), name='message-thread'),
    path('messages/<int:user_id>/read/', MessageMarkReadView.as_view(), name='message-mark-read'),
    path('courses/ai-chat/', AIChatView.as_view(), name='course-ai-chat'),
    path('submissions/<int:pk>/feedback/', SubmissionFeedbackView.as_view(), name='submission-feedback'),
    path(
        'submissions/<int:pk>/submitted-file/',
        SubmissionSubmittedFileView.as_view(),
        name='submission-submitted-file',
    ),
    path(
        'submissions/<int:pk>/annotated-file/',
        SubmissionAnnotatedFileView.as_view(),
        name='submission-annotated-file',
    ),
    path('', include(router.urls)),
]
