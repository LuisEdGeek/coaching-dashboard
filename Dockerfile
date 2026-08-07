# syntax=docker/dockerfile:1
#
# Ops dashboard (Vite static build + nginx).
# Build arg VITE_API_BASE_URL is baked at build time — set it in Coolify.

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# Coolify may inject NODE_ENV=production; vite/tsc live in devDependencies.
RUN npm ci --include=dev

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
