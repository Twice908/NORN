# Deployment

Norn can run as a Docker Compose stack on a self-hosted machine or as separate
services on infrastructure that supports Docker containers. Configure the
application with the environment variables in `.env.example` and keep
`AUTH_SECRET`, database credentials, and production email credentials private.

## Pulling prebuilt images

Release tags publish multi-architecture images to GitHub Container Registry:

```bash
docker pull ghcr.io/Twice908/norn-api:latest
docker pull ghcr.io/Twice908/norn-worker:latest
docker pull ghcr.io/Twice908/norn-web:latest
```

The GHCR workflow runs for `v*` tags or by manual dispatch. It publishes
`linux/amd64` and `linux/arm64` images with provenance and SBOM metadata.

## Production notes

- Use a managed or self-hosted PostgreSQL/TimescaleDB instance and Redis that
  are reachable by the API and worker.
- Set `EMAIL_TRANSPORT=smtp` for a self-hosted SMTP server or Mailpit, or use
  `EMAIL_TRANSPORT=resend` with the Resend variables for production delivery.
- Put the web dashboard and API behind TLS and set public URLs accordingly.
- Run database migrations before starting the API and worker.
