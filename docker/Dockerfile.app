# docker/Dockerfile.app

FROM mcr.microsoft.com/devcontainers/python:3.12

# Install system deps: PostgreSQL client, Redis tools, Pandoc + XeLaTeX + CJK + Noto fonts
RUN apt-get update && \
    apt-get install -y \
    postgresql-client \
    redis-tools \
    pandoc \
    texlive-xetex \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-lang-cjk \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Python requirements
COPY py/requirements-app.txt /workspace/requirements-app.txt
COPY py/requirements-dev.txt /workspace/requirements-dev.txt
COPY py/packages/corpora_proj/requirements.txt /workspace/packages/corpora_proj/requirements.txt
COPY py/packages/corpora/requirements.txt /workspace/packages/corpora/requirements.txt
COPY py/packages/corpora_ai_openai/requirements.txt /workspace/packages/corpora_ai_openai/requirements.txt
RUN pip install --no-cache-dir -r /workspace/requirements-app.txt

CMD ["sleep", "infinity"]
