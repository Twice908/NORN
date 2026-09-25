import IORedis from 'ioredis'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@norn/db'

const HEARTBEAT_INTERVAL_MS = 30_000
const INITIAL_RUN_LIMIT = 20

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findFirst({ where: { id: params.id, userId } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const initialRuns = await prisma.agentRun.findMany({
    where: { projectId: params.id },
    include: { _count: { select: { spans: true } } },
    orderBy: { startedAt: 'desc' },
    take: INITIAL_RUN_LIMIT,
  })

  const encoder = new TextEncoder()
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let subscriber: IORedis | undefined
  let closeStream: (() => void) | undefined

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk))

      for (const run of initialRuns.reverse()) {
        write(`data: ${JSON.stringify({
          id: run.id,
          projectId: run.projectId,
          task: run.task,
          status: run.status,
          startedAt: run.startedAt.toISOString(),
          endedAt: run.endedAt?.toISOString() ?? null,
          totalTokens: run.totalTokens,
          totalCostUsd: run.totalCostUsd?.toNumber() ?? null,
          spanCount: run._count.spans,
        })}\n\n`)
      }

      subscriber = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
      })
      await subscriber.subscribe(`agent-runs:${params.id}`)
      subscriber.on('message', (_channel, message) => write(`data: ${message}\n\n`))
      heartbeat = setInterval(() => write(': heartbeat\n\n'), HEARTBEAT_INTERVAL_MS)
      closeStream = () => {
        if (heartbeat) clearInterval(heartbeat)
        subscriber?.unsubscribe().finally(() => subscriber?.disconnect())
      }
    },
    cancel() {
      closeStream?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
