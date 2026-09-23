# syntax=docker/dockerfile:1.7

FROM node:20.18.0-bookworm-slim AS builder
WORKDIR /app

# OpenSSL needed for Prisma engine generation + runtime libs
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install --include=dev
RUN npx turbo run build --filter=@pulse/api


FROM node:20.18.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL runtime libs BEFORE creating app user
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

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/api"]