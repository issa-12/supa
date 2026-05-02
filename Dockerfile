# syntax=docker/dockerfile:1.7

FROM node:20.19.2-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20.19.2-bookworm-slim AS backend

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD ["npm", "run", "serve:ssr:books-media-platform"]

FROM nginx:1.27-alpine AS frontend

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/books-media-platform/browser /usr/share/nginx/html

EXPOSE 80
