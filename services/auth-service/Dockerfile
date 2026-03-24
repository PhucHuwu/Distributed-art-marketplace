FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY services/auth-service/package.json ./services/auth-service/package.json
RUN npm install

COPY . .
RUN npm run build --workspace services/auth-service

EXPOSE 4001
CMD ["npm", "run", "start", "--workspace", "services/auth-service"]
