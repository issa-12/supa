# syntax=docker/dockerfile:1.7

# ── Stage 1: Build Angular SPA ────────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-frontend

# Ensure devDependencies (incl. @angular/cli → `ng`) install.
ENV NODE_ENV=development

# npm fetch resilience: tolerate the flaky/reset-prone network seen in the
# WSL2 Docker build (more retries, longer backoff/timeout) so a transient
# ECONNRESET doesn't abort the whole `npm ci`.
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev --no-audit --no-fund && test -x node_modules/.bin/ng

COPY . .
RUN npm run build

# ── Stage 2: nginx serves the Angular SPA over HTTPS ──────────
FROM nginx:1.27-alpine AS frontend

# openssl is used by the cert entrypoint to generate a self-signed fallback
# when no trusted cert is mounted.
RUN apk add --no-cache openssl

# At startup, use a cert/key mounted at /certs (e.g. a locally-trusted mkcert
# pair → no browser warning, service worker / PWA works) if present; otherwise
# generate a self-signed fallback so `docker compose up` always works.
COPY docker/ensure-certs.sh /docker-entrypoint.d/40-ensure-certs.sh
RUN chmod +x /docker-entrypoint.d/40-ensure-certs.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-frontend /app/dist/books-media-platform/browser /usr/share/nginx/html

EXPOSE 80 443

# ── Stage 3: Build NestJS backend ─────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-backend

# Ensure devDependencies (incl. @nestjs/cli → `nest`) install. Pruned after build.
ENV NODE_ENV=development

# npm fetch resilience (see build-frontend stage).
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund && test -x node_modules/.bin/nest

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
