import mimetypes

from django.conf import settings
from django.contrib import admin
from django.http import FileResponse
from django.urls import include, path
from django.views.static import serve


def media_serve_inline(request, path):
    """Serve media files in development with inline Content-Disposition."""
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    if isinstance(response, FileResponse):
        content_type, _ = mimetypes.guess_type(path)
        if content_type:
            response.headers['Content-Type'] = content_type
        response.headers['Content-Disposition'] = 'inline'
    return response


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('courses.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        path(f'{settings.MEDIA_URL.lstrip("/")}<path:path>', media_serve_inline),
    ]
