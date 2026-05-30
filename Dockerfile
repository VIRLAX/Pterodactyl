FROM node:20-alpine AS base

RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ ./packages/

# Copy API server source
COPY artifacts/api-server/ ./artifacts/api-server/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

# Build
RUN pnpm --filter @workspace/api-server run build 2>/dev/null || true

# Create backup directory
RUN mkdir -p /app/artifacts/api-server/data/backups

# ─── Production stage ───
FROM node:20-alpine AS runner

RUN npm install -g pnpm@10

WORKDIR /app

COPY --from=base /app .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/api/healthz || exit 1

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "dev"]
