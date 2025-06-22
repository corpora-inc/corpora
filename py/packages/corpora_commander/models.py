from django.db import models


class Project(models.Model):
    """A top-level book/authoring unit."""

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=500, blank=True)
    purpose = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
