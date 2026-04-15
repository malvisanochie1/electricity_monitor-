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

# 3) Pre-create userDir + data dir. server.js copies flows.json on startup
#    and settings.js loads palette nodes from the root node_modules, so no
#    per-image npm install is required here.
RUN mkdir -p /app/node-red-user /app/data

ENV NODE_ENV=production
ENV NODE_RED_USER_DIR=/app/node-red-user
EXPOSE 10000

CMD ["node", "server.js"]
