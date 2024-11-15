FROM mcr.microsoft.com/devcontainers/python:3.12

RUN apt-get update && \
    apt-get install -y \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY py/requirements-app.txt /workspace/requirements-app.txt
COPY py/requirements-dev.txt /workspace/requirements-dev.txt
COPY py/packages/corpora_proj/requirements.txt /workspace/packages/corpora_proj/requirements.txt
COPY py/packages/corpora/requirements.txt /workspace/packages/corpora/requirements.txt
COPY py/packages/corpora_ai_openai/requirements.txt /workspace/packages/corpora_ai_openai/requirements.txt
RUN pip install --no-cache-dir -r /workspace/requirements-app.txt

# CMD ["python", "manage.py", "runserver", "0.0.0.0:8877"]
# CMD ["celery", "-A", "corpora_proj.celery_app.app", "worker", "--loglevel=info"]
CMD ["sleep", "infinity"]
