FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy server package files
COPY apps/server/package*.json ./apps/server/

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/server/package.json ./apps/server/

EXPOSE 3000

CMD ["node", "dist/apps/server/src/index.js"]
