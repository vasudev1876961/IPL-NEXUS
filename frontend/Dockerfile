# ==============================================================================
# IPL Nexus — Frontend Container (Vite Build + Alpine Nginx Reverse Proxy)
# ==============================================================================

# --- Stage 1: Build Production Assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source code and build production bundle
COPY . .
ARG VITE_API_BASE_URL=''
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Stage 2: Serve via Lightweight Nginx ---
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing + reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3     CMD wget -q -O - http://localhost/healthz

CMD ["nginx", "-g", "daemon off;"]
