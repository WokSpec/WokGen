# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build argument for game client URL
ARG NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3002
ENV NEXT_PUBLIC_GAME_CLIENT_URL=${NEXT_PUBLIC_GAME_CLIENT_URL}

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage - use nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
