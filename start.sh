#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required but was not found in PATH." >&2
  exit 1
fi

docker compose up -d --build

for service in norn-timescaledb norn-redis norn-api norn-worker norn-web; do
  echo "Waiting for $service to become healthy..."
  until docker compose ps "$service" --format json 2>/dev/null | grep -q '"Health": "healthy"'; do
    if ! docker compose ps "$service" >/dev/null 2>&1; then
      echo "Service $service is not running yet; retrying..."
    fi
    sleep 2
  done
done

echo
printf 'Norn is running. Dashboard: http://localhost:3000\n'
printf 'API: http://localhost:3001\n'
printf 'Database: postgres://norn:norn@localhost:5433/norn\n'
printf 'Redis: redis://localhost:6380\n\n'
printf 'Next steps:\n'
printf '  1. Edit .env and set your Clerk keys before signing in.\n'
printf '  2. Visit http://localhost:3000 to open the dashboard.\n'
printf '  3. If you need to reset the stack: docker compose down -v\n'
