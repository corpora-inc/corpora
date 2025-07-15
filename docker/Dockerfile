# Base Image
FROM mcr.microsoft.com/devcontainers/python:3.12

# Install necessary system tools and dependencies
RUN apt-get update && \
    apt-get install -y \
    postgresql-client \
    zsh \
    wget \
    npm \
    openjdk-17-jre \
    redis-tools \
    docker-compose \
    build-essential \
    git \
    libffi-dev \
    python3-dev \
    pandoc \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-luatex \
    texlive-lang-cjk \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# TODO: for dev this could probably be in setup.sh
# For production, we can probably simplify to one freezed requirements.txt?
# Set up the workspace and install Python dependencies
WORKDIR /workspace
COPY py/requirements.txt /workspace/requirements.txt
COPY py/requirements-dev.txt /workspace/requirements-dev.txt
COPY py/packages/corpora_proj/requirements.txt /workspace/packages/corpora_proj/requirements.txt
COPY py/packages/corpora/requirements.txt /workspace/packages/corpora/requirements.txt
COPY py/packages/corpora_cli/requirements.txt /workspace/packages/corpora_cli/requirements.txt
COPY py/packages/corpora_client/requirements.txt /workspace/packages/corpora_client/requirements.txt
COPY py/packages/corpora_client/test-requirements.txt /workspace/packages/corpora_client/test-requirements.txt
COPY py/packages/corpora_ai_openai/requirements.txt /workspace/packages/corpora_ai_openai/requirements.txt
RUN pip install --no-cache-dir -r /workspace/requirements.txt

RUN npm install -g @openapitools/openapi-generator-cli && \
    sudo openapi-generator-cli version
RUN npm install -g pnpm

RUN chsh -s /bin/zsh vscode
RUN chown -R vscode:vscode /workspace

USER vscode
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# ENV PATH="/home/vscode/.cargo/bin:${PATH}" (in .zshrc via setup.sh)

# Default CMD for devcontainer
CMD ["sleep", "infinity"]
