# PAO Deployment Readiness — Master Task List

Here is every pending task, grouped by the 5 distribution outcomes you listed, arranged by priority and batched.

---

## BATCH 1 — Blockers Before Any Public Release

These gate everything else. Nothing ships until these are green.

- [ ] **Rotate leaked secrets** — Clerk keys, Resend key, AUTH_SECRET (posted in chat earlier)
- [ ] **Package name decision** — PAO name taken on npm + PyPI; finalize final name across all manifests
- [ ] **Finalize NextAuth migration** — confirm Clerk removal is complete; delete legacy `clerkId` column once API no longer compiles against it
- [ ] **Freeze the ingestion API contract** — `openapi.yaml` versioned, endpoints stable (`/v1/...`), Bearer key format locked
- [ ] **Verify `./start.sh` on a clean machine** — fresh clone, no cache, no pre-existing `.env`
- [ ] **Root LICENSE present** — MIT, matches all package manifests

---

## BATCH 2 — npm SDK (Distribution Way #1)

- [ ] Finalize package name (`pulse-agent` unavailable → rename candidates or scope `@yourorg/...`)
- [ ] Fill `package.json` fields: `repository.url` (exact case), `publishConfig.access`, `files`, `keywords`, `homepage`, `bugs`
- [ ] Confirm `main` / `types` / `exports` resolve after `npm run build`
- [ ] Register Trusted Publisher on npmjs.com
- [ ] Verify `.github/workflows/publish-npm.yml` — OIDC, `id-token: write`, no NPM_TOKEN
- [ ] Dry run: `npm pack --dry-run`, confirm tarball contains only `dist/`, `README.md`, `LICENSE`
- [ ] Tag `v0.1.0` → push → confirm package live with provenance badge
- [ ] Add README install snippet + usage example
- [ ] Document endpoint configuration for self-host vs hosted

---

## BATCH 3 — Python SDK (Distribution Way #2)

- [ ] Finalize package name (mirror npm decision)
- [ ] Complete `pyproject.toml`: `readme`, `license`, `authors`, `[project.urls]`, classifiers, `requires-python`
- [ ] Confirm Hatch wheel config ships correct package dir
- [ ] Register pending Trusted Publisher on PyPI
- [ ] Verify `.github/workflows/publish-pypi.yml` — OIDC only, no tokens
- [ ] Dry run: `python -m build && twine check dist/*`
- [ ] Tag `v0.1.0` → push → confirm package live with attestations
- [ ] Add README install + usage example
- [ ] Document endpoint configuration

---

## BATCH 4 — n8n Community Node (Distribution Way #3)

- [ ] Create `n8n-nodes-pao` package (separate repo or subfolder)
- [ ] Implement `PAO Log Run` node (ingestion client)
- [ ] Implement `PAO Trigger` node (alert receiver)
- [ ] Credentials type: PAO URL + API key
- [ ] Provenance-enabled publish workflow
- [ ] Submit to n8n community directory
- [ ] Add usage docs + example workflow JSON
- [ ] Announce in n8n community forum

---

## BATCH 5 — Self-Hosters (Distribution Way #4)

- [ ] Verify README 3-command Quick Start works on fresh clone
- [ ] Confirm `.env.example` has zero Clerk references
- [ ] Confirm Mailpit is default email transport, Resend optional
- [ ] Add `docs/deployment.md` (self-host + VPS + Docker Compose)
- [ ] Add `.dockerignore` (already done in P1 — verify no regressions)
- [ ] Add web health endpoint (already done — verify)
- [ ] Add backup / restore guide for TimescaleDB
- [ ] Add upgrade guide (pull new images, run migrations)
- [ ] Add troubleshooting doc (common env, port, SSL issues)
- [ ] Test on a $5 VPS (Hetzner / DO) with public DNS + HTTPS via Caddy

---

## BATCH 6 — PAO-Hosted SaaS (Distribution Way #5)

This is what **you (PAO org)** must deploy for end users of all 4 channels to see their logs if they don't self-host.

### 6a. Infrastructure

- [ ] Host the Next.js dashboard (`app.pao.dev` or similar)
- [ ] Host the ingestion API (`ingest.pao.dev`)
- [ ] Host the worker service
- [ ] Managed TimescaleDB (Timescale Cloud / RDS / self-managed with backups)
- [ ] Managed Redis (Upstash / ElastiCache)
- [ ] Email transport: Resend (or SES/Postmark) — Mailpit is dev-only
- [ ] Public DNS + TLS certs (Caddy / Cloudflare)
- [ ] CDN / edge for dashboard assets
- [ ] CI/CD pipeline to deploy on tag

### 6b. Multi-Tenancy (critical, currently missing)

- [ ] Add `organizationId` / `projectId` scoping to every query
- [ ] Row-level security in TimescaleDB **or** schema-per-tenant **or** DB-per-tenant
- [ ] Enforce tenant isolation in the API, worker, and dashboard
- [ ] Add tenant-aware rate limiting
- [ ] Add per-tenant data retention policies
- [ ] Audit all Prisma queries for missing tenant filters
- [ ] Add integration tests proving cross-tenant data isolation
- [ ] Decide isolation model: shared DB + RLS (cheapest) vs schema-per-tenant (safer) vs DB-per-tenant (safest, most expensive)

### 6c. Auth for hosted users

- [ ] Keep NextAuth for self-hosted
- [ ] For SaaS, decide: NextAuth again, or OAuth (GitHub/Google), or both
- [ ] Public signup flow (already exists — needs field cleanup: remove self-host-only fields)
- [ ] Email verification on signup (via Resend, not Mailpit)
- [ ] Password reset flow (via Resend)
- [ ] Session management across subdomains (`app.` ↔ `ingest.`)
- [ ] SSO / OIDC for enterprise tier

### 6d. Billing

- [ ] Confirm payment provider (Stripe? — verify if "already integrated" claim is real)
- [ ] Define plans (Free / Pro / Team / Enterprise)
- [ ] Enforce plan limits: traces/month, retention days, seats
- [ ] Usage metering pipeline (traces count → billing)
- [ ] Stripe webhooks → plan state in DB
- [ ] Trial flow
- [ ] Invoice + receipt emails via Resend
- [ ] Cancellation / downgrade flow
- [ ] Dunning (failed payment) flow

### 6e. Ops & reliability

- [ ] Backups: daily DB snapshots + tested restore
- [ ] Monitoring: uptime, error rates, latency (Grafana / Better Stack / Sentry)
- [ ] Log aggregation (Loki / CloudWatch / Datadog)
- [ ] Alerting: page on-call when ingestion or dashboard goes down
- [ ] Horizontal scaling plan: API, worker, DB read replicas
- [ ] Load testing (k6 / Locust) — target X traces/sec
- [ ] Cost model: infra cost per 1M traces
- [ ] Incident response runbook
- [ ] Status page (`status.pao.dev`)

### 6f. Security

- [ ] Secrets management (Vault / AWS Secrets Manager / Doppler)
- [ ] API key rotation UX for hosted users
- [ ] Rate limiting per API key + per IP
- [ ] WAF / DDoS protection (Cloudflare)
- [ ] Penetration test before public launch
- [ ] SOC2 readiness checklist (if enterprise target)
- [ ] GDPR: data export, deletion, DPA
- [ ] Encryption at rest + in transit
- [ ] Audit logs for admin actions

### 6g. Public-facing surface

- [ ] Marketing landing page (`pao.dev`)
- [ ] Pricing page
- [ ] Signup / login pages (public)
- [ ] Docs site (self-host + SaaS in one place)
- [ ] Status page
- [ ] Terms of Service + Privacy Policy
- [ ] Demo video + screenshots
- [ ] Comparison page vs LangSmith (already planned in P1)

---

## Priority Ordering (What to Do, In What Order)

### 🔴 Week 1 — Pre-launch blockers
1. Rotate secrets
2. Finalize package names
3. Freeze API contract
4. Close NextAuth + Clerk cleanup
5. Fresh-clone test on clean machine

### 🟠 Week 2 — Get SDKs published
6. npm SDK complete + published (Batch 2)
7. PyPI SDK complete + published (Batch 3)
8. Announce both in README + docs

### 🟡 Week 3 — n8n node + self-host polish
9. n8n community node (Batch 4)
10. Self-host docs, backup, upgrade, troubleshooting (Batch 5)

### 🟢 Week 4–6 — Multi-tenancy (the hard part)
11. Decide isolation model
12. Enforce tenant scoping across API + worker + dashboard
13. Integration tests for cross-tenant isolation
14. Migrate existing single-DB data to tenant-scoped schema

### 🔵 Week 6–8 — SaaS infrastructure
15. Deploy dashboard + API + worker + DB + Redis to production
16. Wire DNS + TLS
17. Signup + verification + password reset via Resend
18. Billing (Stripe) — verify existing integration, finish limits + webhooks
19. Backups, monitoring, alerting
20. Security hardening + pen test

### 🟣 Week 8–10 — Public launch of hosted tier
21. Landing page + pricing page
22. ToS + Privacy
23. Status page
24. Public launch announcement
25. On-call + incident response ready

---

## The Critical Path (One Line)

```
Secrets rotated → Names finalized → API frozen → SDKs published 
→ n8n node shipped → Multi-tenancy enforced → Infra deployed 
→ Billing + Auth finalized → Security hardened → Public launch
```

---

## What's Actually Missing vs What You Think Is Done

Be careful here. Three things you mentioned as "ready" need verification:

| Claim | Verify by |
|-------|-----------|
| "Payment model already integrated" | Search repo for `stripe`, `checkout`, `subscription`, `billing` — confirm it works, not just exists |
| "Signup flow ready, needs field cleanup" | Open signup in a fresh browser — do fields match hosted flow (no self-host-only fields)? |
| "Full stack ready for deployment" | Has it ever been deployed to a real cloud host with real DNS + TLS + non-local DB? Localhost Docker ≠ deployable |

These three are the most likely to surprise you mid-launch. Verify them in Batch 1 before building anything else.