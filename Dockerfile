# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy rest of the application files
COPY . .

# Build application
RUN npm run build

# Stage 2: Production environment
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from Stage 1 to Nginx default folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
