FROM node:20-bookworm-slim

# node-red-node-sqlite compiles a native addon — needs build tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Root deps: aedes, mqtt, node-red itself.
COPY package*.json ./
RUN npm install --omit=dev

# 2) App source (Dockerfile, server.js, config/, scripts/, public/, flows/...).
COPY . .

# 3) Build a self-contained Node-RED userDir from scratch.
#    No dependency on a committed .node-red/ folder.
RUN mkdir -p /app/node-red-user \
 && cd /app/node-red-user \
 && npm init -y >/dev/null \
 && npm install --omit=dev \
        node-red-dashboard@^3.6.6 \
        node-red-node-sqlite@^2.0.0 \
 && cp /app/flows/electricity-monitor.json /app/node-red-user/flows.json

# SQLite file lives here (ephemeral on Render free tier — resets on redeploy).
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV NODE_RED_USER_DIR=/app/node-red-user
EXPOSE 10000

CMD ["node", "server.js"]
