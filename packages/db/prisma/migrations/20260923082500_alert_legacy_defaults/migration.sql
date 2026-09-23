ALTER TABLE "Alert"
  ALTER COLUMN "type" SET DEFAULT 'run_failed',
  ALTER COLUMN "threshold" SET DEFAULT 1,
  ALTER COLUMN "channel" SET DEFAULT 'email',
  ALTER COLUMN "destination" SET DEFAULT '';