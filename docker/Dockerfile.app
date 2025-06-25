# docker/Dockerfile.app

FROM mcr.microsoft.com/devcontainers/python:3.12

# Install system dependencies, including pandoc & XeLaTeX for PDF export
RUN apt-get update && \
    apt-get install -y \
    postgresql-client \
    redis-tools \
    pandoc \
    texlive-xetex \
    # fonts and deps for XeLaTeX
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-luatex \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy and install Python dependencies
COPY py/requirements-app.txt /workspace/requirements-app.txt
COPY py/requirements-dev.txt /workspace/requirements-dev.txt
COPY py/packages/corpora_proj/requirements.txt /workspace/packages/corpora_proj/requirements.txt
COPY py/packages/corpora/requirements.txt /workspace/packages/corpora/requirements.txt
COPY py/packages/corpora_ai_openai/requirements.txt /workspace/packages/corpora_ai_openai/requirements.txt

RUN pip install --no-cache-dir -r /workspace/requirements-app.txt

# By default, leave the container running; override in docker-compose or with your own startup command
CMD ["sleep", "infinity"]
