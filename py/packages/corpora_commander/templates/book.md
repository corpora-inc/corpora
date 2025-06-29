{% autoescape off %}

{% for section in project.sections.all %}
# {{ section.title }}

{{ section.introduction }}

{% for subsection in section.subsections.all %}
{{ subsection.content }}

{% endfor %}
{% endfor %}

{% endautoescape %}
