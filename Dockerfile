# syntax=docker/dockerfile:1.7

# ── Stage 1: Build Angular SPA ────────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-frontend

ENV NODE_ENV=development

# npm fetch resilience for the flaky WSL2 → registry network (ECONNRESET):
# retry dropped connections instead of failing the whole build.
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=60000

# Upgrade npm once in its own layer — stays cached unless this line changes.
# Retry loop guards against a mid-TLS reset on this single global install.
RUN for i in 1 2 3 4 5; do npm install -g npm@10.9.2 && break || sleep 10; done

WORKDIR /app

COPY package*.json ./
# --mount=type=cache reuses the npm download cache across rebuilds so
# packages are not re-downloaded when only source files change.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund && test -x node_modules/.bin/ng

COPY . .
RUN npm run build

# ── Stage 2: nginx serves the Angular SPA over HTTPS ──────────
FROM nginx:1.27-alpine AS frontend

RUN apk add --no-cache openssl

COPY docker/ensure-certs.sh /docker-entrypoint.d/40-ensure-certs.sh
RUN chmod +x /docker-entrypoint.d/40-ensure-certs.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-frontend /app/dist/books-media-platform/browser /usr/share/nginx/html

EXPOSE 80 443

# ── Stage 3: Build NestJS backend ─────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-backend

ENV NODE_ENV=development

ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=60000

RUN for i in 1 2 3 4 5; do npm install -g npm@10.9.2 && break || sleep 10; done

WORKDIR /app

COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund && test -x node_modules/.bin/nest

COPY backend/ .
RUN npm run build
RUN npm prune --omit=dev

# ── Stage 4: Run NestJS backend ───────────────────────────────
FROM node:20.19.2-bookworm-slim AS backend

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build-backend /app/package*.json ./
COPY --from=build-backend /app/node_modules ./node_modules
COPY --from=build-backend /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
