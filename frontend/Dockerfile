# ============================================
# ARKIFLO FRONTEND - Production Dockerfile
# Multi-stage build: Build React + Serve with Nginx
# ============================================

# -------- Stage 1: Build React App --------
FROM node:18-alpine AS builder

# Install build dependencies for native modules
# - python3, make, g++: Required for node-gyp (native module compilation)
# - git: Some packages fetch from git repos
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Accept build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Increase Node memory for large builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files first (better layer caching)
COPY package.json yarn.lock ./

# Install dependencies
# --network-timeout: Prevent timeout on slow connections
# --frozen-lockfile: Ensure reproducible builds
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy source code
COPY . .

# Build production bundle
RUN yarn build

# -------- Stage 2: Serve with Nginx --------
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
