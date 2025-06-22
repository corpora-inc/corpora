from django.db import models


class Project(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=500, blank=True)
    purpose = models.TextField(blank=True)
    author = models.CharField(max_length=200, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=32, blank=True)
    language = models.CharField(max_length=10, default="en-US")
    publication_date = models.DateField(null=True, blank=True)

    # LLM guidance fields
    instructions = models.TextField(
        blank=True,
        help_text="System-level prompt to guide the LLM (tone, style, etc.)",
    )
    voice = models.TextField(
        blank=True,
        help_text='Narrative voice (e.g. "academic", "conversational")',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
