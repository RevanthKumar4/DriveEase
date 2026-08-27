# ============================================================
# DriveEase — Frontend Dockerfile
# Multi-stage build: Node (Angular build) → nginx static serve
# ============================================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (caches npm install layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build -- --configuration production

# ============================================================
# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Add our custom nginx config for Angular SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular files from builder
COPY --from=builder /app/dist/angularapp /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
