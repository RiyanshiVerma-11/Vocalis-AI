# ── Stage 1: Build Frontend & Backend Bundles ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests & install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# ── Stage 2: Minimal Production Runtime Image ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copy package manifests & install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled dist bundle from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]
