# syntax=docker/dockerfile:1.7

# ── Stage 1: Build Angular SPA ────────────────────────────────
FROM node:20.19.2-bookworm-slim AS build-frontend

WORKDIR /app

COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --include=dev

COPY . .
RUN npm run build

# ── Stage 2: nginx serves the Angular SPA ─────────────────────
FROM nginx:1.27-alpine AS frontend

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-frontend /app/dist/books-media-platform/browser /usr/share/nginx/html

EXPOSE 80

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
