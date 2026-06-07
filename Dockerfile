# syntax=docker/dockerfile:1.7

# ── Stage 1: Build Angular SPA ────────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-frontend

WORKDIR /app

COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --include=dev

COPY . .
RUN npm run build

# ── Stage 2: nginx serves the Angular SPA over HTTPS ──────────
FROM nginx:1.27-alpine AS frontend

# Self-signed TLS cert so the app serves HTTPS out of the box with a
# single `docker compose up`. For a real deployment, mount a CA-issued
# cert/key over /etc/nginx/certs (see production checklist in CLAUDE.md).
RUN apk add --no-cache openssl \
 && mkdir -p /etc/nginx/certs \
 && openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /etc/nginx/certs/selfsigned.key \
      -out  /etc/nginx/certs/selfsigned.crt \
      -days 825 \
      -subj "/C=US/ST=Local/L=Local/O=ReadTrack/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-frontend /app/dist/books-media-platform/browser /usr/share/nginx/html

EXPOSE 80 443

# ── Stage 3: Build NestJS backend ─────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-backend

WORKDIR /app

COPY backend/package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --include=dev

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
