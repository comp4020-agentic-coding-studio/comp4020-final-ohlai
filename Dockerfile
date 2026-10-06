# syntax = docker/dockerfile:1

# Node's built-in http and sqlite, no dependencies, so there is nothing to
# install. The database lives on the Fly volume at /data.
FROM docker.io/library/node:24-alpine
WORKDIR /app
COPY server.js README.md ./
COPY scripts/seed-jack.js scripts/
COPY public/ public/
ENV DATA_DIR=/data NODE_ENV=production
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
