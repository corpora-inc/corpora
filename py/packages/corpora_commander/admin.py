# corpora_commander/admin.py

from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "publisher",
        "publication_date",
        "created_at",
    )
    list_filter = (
        "publisher",
        "language",
        "publication_date",
    )
    search_fields = (
        "title",
        "subtitle",
        "purpose",
        "author",
        "publisher",
        "isbn",
    )
    date_hierarchy = "publication_date"
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "title",
                    "subtitle",
                    "purpose",
                ),
            },
        ),
        (
            "Publication",
            {
                "fields": (
                    "author",
                    "publisher",
                    "isbn",
                    "language",
                    "publication_date",
                ),
            },
        ),
        (
            "LLM Guidance",
            {
                "fields": (
                    "instructions",
                    "voice",
                ),
                "description": "Optional prompts and voice settings for AI workflows",
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )
