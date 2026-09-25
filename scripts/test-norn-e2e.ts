/**
 * Manual end-to-end smoke test (task 7.1 in docs/norn-tasks.md).
 *
 * Sends a fake agent run (run_start -> span -> run_end) through @norn/agent
 * to a running apps/api instance. Verify the run appears under
 * /dashboard/agents within a couple of seconds.
 *
 * Usage:
 *   NORN_TEST_KEY=pk_live_... npm run test:e2e
 *   NORN_TEST_KEY=pk_live_... NORN_HOST=http://localhost:3001 npm run test:e2e
 */
import { NornAgent } from '@norn/agent'

const apiKey = process.env.NORN_TEST_KEY
if (!apiKey) {
  console.error('Missing NORN_TEST_KEY env var (a project API key from /dashboard/settings)')
  process.exit(1)
}

const norn = new NornAgent({
  apiKey,
  host: process.env.NORN_HOST ?? 'http://localhost:3001',
})

const run = await norn.startRun('E2E smoke test')
const span = run.startSpan('llm_call', { name: 'fake-gpt4', model: 'gpt-4o', inputPreview: 'Hello' })
await new Promise((r) => setTimeout(r, 100))
span.end({ outputPreview: 'World', inputTokens: 10, outputTokens: 5, status: 'success' })
await run.complete({ status: 'completed' })

console.log('Run ID:', run.id)
console.log('Check /dashboard/agents for this run within a couple of seconds.')
