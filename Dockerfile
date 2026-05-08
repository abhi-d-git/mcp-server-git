FROM node:20-alpine AS builder
WORKDIR /app
COPY mcp-platform-kit ./mcp-platform-kit
COPY mcp-server-git ./mcp-server-git
WORKDIR /app/mcp-platform-kit
RUN npm install && npm run build
WORKDIR /app/mcp-server-git
RUN npm install && npm run build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/mcp-server-git/package*.json ./
COPY --from=builder /app/mcp-server-git/node_modules ./node_modules
COPY --from=builder /app/mcp-server-git/dist ./dist
EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD curl -f http://localhost:3002/health || exit 1
CMD ["node", "dist/index.js"]
