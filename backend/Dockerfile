# Backend - Node/Express API
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]