# ============================================
# ARKIFLO FRONTEND - Production Dockerfile
# ============================================

# -------- Stage 1: Build React App --------
FROM node:18-alpine AS builder

# Build tools for native deps
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Build arguments
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Reduce npm noise & memory issues
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV npm_config_loglevel=warn
ENV npm_config_progress=false

# Copy package files
COPY package.json package-lock.json* ./

# 🔑 CRITICAL FIX
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build
RUN npm run build


# -------- Stage 2: Serve with Nginx --------
FROM nginx:alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
