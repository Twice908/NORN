# Norn vs. LangSmith

## TL;DR

Norn is a free, self-hosted observability stack for AI agents. It stores agent
runs and spans in your own TimescaleDB, queues processing through Redis, and
provides a local dashboard and alerting.

LangSmith is a hosted observability and evaluation platform from LangChain. It
is a strong fit when you want a managed service, LangChain-native workflows,
evaluation datasets, a playground, and team administration without operating
those services yourself.

Choose Norn when data ownership, local operation, and a self-hosted first setup
matter most. Choose LangSmith when its managed collaboration and evaluation
features are more important than running the data plane yourself.

## Feature comparison

| Capability | Norn | LangSmith |
| --- | --- | --- |
| Hosting | Self-hosted / free | SaaS |
| Data ownership | You own TimescaleDB | LangChain Inc. |
| Auth | Local NextAuth | Managed |
| Email / alerts | Mailpit (local) or Resend | Managed |
| SDKs | Node + Python | Python + JS |
| Pricing | Free, MIT | Free tier + paid |
| Setup | `docker compose up` | Sign up |

The exact LangSmith plan limits and features can change; check its current
product documentation before making a purchasing decision.

## If you're coming from LangSmith

### Map concepts

- LangSmith Runs map most closely to Norn `AgentRun` records.
- LangSmith child runs and trace events map most closely to Norn `AgentSpan`
  records.
- A Norn project groups agent activity in the dashboard and scopes ingestion
  keys.

These are conceptual mappings, not a claim of wire-level compatibility.

### Point the SDK at Norn

Install and configure the Norn SDK for the language your agent uses. Set its API
key and base URL to the Norn ingestion API, then send runs and spans through the
SDK. A minimal TypeScript example is:

```ts
import { NornAgent } from '@norn/agent'

const norn = new NornAgent({
  apiKey: process.env.NORN_API_KEY!,
  host: 'http://localhost:3001',
})
```

For Python, use `norn-agent` and set `base_url` to the same Norn API host. The
SDKs are designed to send structured agent runs and spans; they do not translate
LangSmith SDK calls automatically.

### What Norn does not support yet

Norn does not currently provide:

- Evaluation datasets and experiment management
- A prompt or trace playground
- Team RBAC and managed organization administration
- Automatic compatibility with every LangChain integration

Plan a migration around the trace and alerting workflows that Norn currently
supports. Keep existing evaluation data and LangSmith-specific metadata in its
original system until an explicit migration path exists.

## When to choose LangSmith

LangSmith is a reasonable choice when your team needs a managed platform,
LangChain integration depth, evaluation datasets, a playground, or mature team
RBAC. It also avoids operating PostgreSQL, Redis, workers, upgrades, backups,
and email delivery yourself.

Norn is a reasonable choice when deployment must remain under your control,
network access should stay local, or a hosted observability account is not
acceptable. Norn also makes Mailpit available for local alert testing without
sending data outside the development environment.

## Related documentation

- [Norn README](../README.md)
- [Mailpit setup](mailpit-setup.md)
- [Deployment](deployment.md)
