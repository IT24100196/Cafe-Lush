from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.static import serve


def root_healthcheck(request):
    return JsonResponse({
        'status': 'ok',
        'service': 'Cafe-Lush API',
    })


def robots_txt(request):
    return HttpResponse('User-agent: *\nDisallow:\n', content_type='text/plain')


def favicon(request):
    return HttpResponse(status=204)

urlpatterns = [
    path('', root_healthcheck),
    path('robots.txt', robots_txt),
    path('favicon.ico', favicon),
    path('admin/', admin.site.urls),
    path('api/auth/',     include('authentication.urls')),
    path('api/meals/',    include('meals.urls')),
    path('api/pos/',      include('pos.urls')),
    path('api/events/',   include('events.urls')),
    path('api/partners/', include('partners.urls')),
    path('api/reports/',  include('reports.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
