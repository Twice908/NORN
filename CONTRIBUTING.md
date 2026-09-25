# Contributing to Norn

Thanks for helping improve Norn, a self-hosted, privacy-first observability
stack for AI agents.

## Local development

```bash
git clone https://github.com/Twice908/NORN.git
cd NORN
cp .env.example .env
./start.sh
```

`./start.sh` starts the Docker Compose stack and waits for the core services.
Mailpit is available at http://localhost:8025. The dashboard is at
http://localhost:3000 and the API is at http://localhost:3001.

For a host-based development loop:

```bash
npm install
npm run dev
```

The database and Redis services can run independently with:

```bash
docker compose up -d
```

## Project structure

- `apps/` contains the API, worker, and Next.js web dashboard.
- `packages/` contains the database package, shared types, and Node and Python SDKs.
- `docs/` contains architecture, operations, and development documentation.

## Tests and checks

```bash
npm run build
turbo run test
pytest packages/norn-agent-py/tests
```

Run the relevant package checks before opening a pull request. Changes that
cross service boundaries should also be tested through Docker Compose.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/), for example:

```text
feat(web): add trace filter
fix(worker): retry failed alert delivery
docs: clarify local setup
```

## Pull requests

Before requesting review:

- Builds pass.
- Tests pass.
- No new external SaaS dependency is introduced without discussion.
- Self-hosted first: does this work with `EMAIL_TRANSPORT=smtp` and Mailpit?
- User-facing behavior and operational changes are documented.
- The pull request explains tradeoffs and includes verification steps.

## Questions

Ask questions in [GitHub Discussions](https://github.com/Twice908/NORN/discussions).

Please also read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.
