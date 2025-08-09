# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app with the correct API URL
# Default to same-origin API so nginx can proxy /api to backend
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL:-/api}

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3100

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 