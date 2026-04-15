FROM node:20-bookworm-slim

# node-red-node-sqlite compiles a native addon — needs build tools + sqlite headers.
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Root deps (aedes, mqtt, node-red itself).
COPY package*.json ./
RUN npm install --omit=dev

# Node-RED user-directory deps (dashboard + sqlite palette).
COPY .node-red/package*.json ./.node-red/
RUN cd .node-red && npm install --omit=dev

# App source.
COPY . .

# SQLite file location (ephemeral on Render free tier — resets on redeploy).
RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "server.js"]
