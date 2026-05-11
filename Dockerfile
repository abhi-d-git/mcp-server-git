FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY ./package*.json ./

RUN npm install
RUN npm i @abhinav-dev/mcp-platform-kit

COPY . .

RUN npm run build

EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD curl -f http://localhost:3002/health || exit 1
CMD ["node", "dist/index.js"]
