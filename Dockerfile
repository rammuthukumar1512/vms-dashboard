# Stage 1: Build the Angular application
FROM node:18-alpine AS build

# Define the build-time argument
# You can provide a default value here if you want
ARG API_BASE_URL=http://localhost:8089/

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Replace the placeholder in the environment file with the build argument's value
# This happens BEFORE the build command is run.
RUN sed -i "s|__API_BASE_URL__|${API_BASE_URL}|g" ./src/environments/environment.production.ts

# Build the application for production
RUN npm run build -- --configuration production

# Stage 2: Serve the application from Nginx
FROM nginx:1.23-alpine

# Copy the build output from the 'build' stage
COPY --from=build /app/dist/vms-dashboard/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default Nginx command will start the server