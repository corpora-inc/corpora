"""URL Configuration for corpora_proj."""

from corpora.router import api as corpora_router
from corpora.views import BinaryView
from corpora_commander.api import router as commander_router
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from ninja import NinjaAPI
from oauth2_provider import urls as oauth2_urls

router = NinjaAPI(
    title="Corpora API",
    version="0.1.0",
    description="API for managing and processing corpora",
)
router.add_router("corpora", corpora_router)
router.add_router("commander", commander_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("o/", include(oauth2_urls)),
    path("api/", router.urls),
    path("api/docs", router.get_openapi_schema),
]

if settings.DEBUG:
    urlpatterns += [
        path("bin/<str:arch>", BinaryView.as_view(), name="binary"),
    ]
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()
