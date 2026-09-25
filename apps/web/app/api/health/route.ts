import { prisma } from '@pulse/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = { db: false, redis: false }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = true
  } catch {}

  return NextResponse.json(
    { status: checks.db ? 'ok' : 'degraded', checks, ts: Date.now() },
    { status: checks.db ? 200 : 503 },
  )
}