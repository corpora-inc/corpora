{% autoescape off %}
{% load tex %}

{% for section in project.sections.all %}
# {{ section.title|latex_escape }}

{{ section.introduction }}

{% for subsection in section.subsections.all %}
{{ subsection.content }}

{% endfor %}
{% endfor %}

{% endautoescape %}
