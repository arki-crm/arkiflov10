# ============================================
# ARKIFLO FRONTEND - Production Dockerfile
# Multi-stage build: Build React + Serve with Nginx
# ============================================

# -------- Stage 1: Build React App --------
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
RUN yarn build

# -------- Stage 2: Serve with Nginx --------
FROM nginx:alpine

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
