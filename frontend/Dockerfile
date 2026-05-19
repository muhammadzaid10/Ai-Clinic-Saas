# Stage 1: React app (Vite) ko build karna
FROM node:20-alpine AS build

WORKDIR /app

# Package files copy karke dependencies install karein
COPY package*.json ./
RUN npm ci

# Baqi code copy karke build karein
COPY . .
RUN npm run build

# Stage 2: Production server (Nginx) setup karna
FROM nginx:alpine

# Static assets ko Nginx html directory mein copy karein
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx.conf file copy karein
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 80 expose karein
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]