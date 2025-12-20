# Copilot Instructions

## Environment / bootstrap
- Copy `.env.example` to `.env` and fill required secrets (see `.devcontainer/README.md`).
- Devcontainer is the recommended setup; it installs Python/Rust tooling and Docker services.
- Python deps: `pip install -r py/requirements.txt` (devcontainer already handles this).
- Frontend deps:
  - `cd ts/commander && pnpm install --frozen-lockfile`
  - `cd encorpora/corpus-reader && npm install`
  - `cd encorpora/corpan/corpan-app && npm install`
  - `cd encorpora/panko/pako && npm install`

You can generate the client in `ts/commander/src/api/` by running:

```
pnpm run gen:api
```

DO NOT EDIT THE FILES IN `ts/commander/src/api/` DIRECTLY.


## Dev servers
- Backend (API + workers + db + redis): `docker compose up` (serves `http://localhost:8877`).
- Backend (local, no Docker): `cd py/packages && uvicorn corpora_proj.asgi:application --host 0.0.0.0 --port 8877 --reload`
- Frontend (commander): `cd ts/commander && pnpm dev`
- Frontend (encorpora apps): `cd encorpora/corpus-reader && npm run dev`, `cd encorpora/corpan/corpan-app && npm run dev`, `cd encorpora/panko/pako && npm run dev`

## Format / lint / typecheck / test
- Python
  - Format: `cd py && ruff format`
  - Lint: `cd py && ruff check`
  - Typecheck: not configured
  - Test: `PYTHONPATH=py/packages POSTGRES_HOST=localhost pytest py/`
- Rust (workspace in `rs/`)
  - Format: `cd rs && cargo fmt`
  - Lint: `cd rs && cargo clippy --workspace --all-targets -- -A clippy::uninlined-format-args -D warnings`
  - Typecheck/build: `cd rs && cargo build --workspace --all-targets`
  - Test: `cd rs && cargo test --workspace`
- TypeScript (commander in `ts/commander`)
  - Format: not configured (no script)
  - Lint: `cd ts/commander && pnpm lint`
  - Typecheck/build: `cd ts/commander && pnpm run build`
  - Test: not configured
- TypeScript (encorpora apps)
  - Format/lint/typecheck/test: not configured (no scripts)
