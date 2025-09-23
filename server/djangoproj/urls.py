"""
djangoproj URL Configuration
"""
from django.contrib import admin
from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import path, include
from django.views.generic import TemplateView, RedirectView
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    path("admin/", admin.site.urls),
    path("djangoapp/", include("djangoapp.urls")),
    path("", TemplateView.as_view(template_name="Home.html")),
    path("about/", TemplateView.as_view(template_name="About.html")),
    path("contact/", TemplateView.as_view(template_name="Contact.html")),
    path("login/", TemplateView.as_view(template_name="index.html")),
    path("register/", TemplateView.as_view(template_name="index.html")),
    path("dealers/", TemplateView.as_view(template_name="index.html")),
    path(
        "dealer/<int:dealer_id>",
        TemplateView.as_view(template_name="index.html"),
    ),
    path(
        "manifest.json",
        RedirectView.as_view(
            url=staticfiles_storage.url("manifest.json"),
            permanent=False,
        ),
    ),
    path(
        "postreview/<int:dealer_id>",
        TemplateView.as_view(template_name="index.html"),
    ),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
