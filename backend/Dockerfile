# 1. Node.js ka official lightweight image use karein
FROM node:20-alpine

# 2. Container ke andar app directory set karein
WORKDIR /app

# 3. Dependencies files copy karein
COPY package*.json ./

# 4. Production-only dependencies install karein (clean install)
RUN npm ci

# 5. Baqi saara backend code copy karein
COPY . .

# 6. Backend Port expose karein (e.g., 5000)
EXPOSE 5000

# 7. Backend start karne ki command
CMD ["npm", "start"]