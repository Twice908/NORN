# syntax=docker/dockerfile:1.7

FROM node:20.18.0-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install --include=dev
RUN npx turbo run build --filter=@pulse/worker


FROM node:20.18.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages

RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --create-home app \
 && chown -R app:app /app

USER app

CMD ["npm", "run", "start", "-w", "apps/worker"]