# RECEIPTS Guard v0.7.0 - Cloud Deployment
# Agent commerce infrastructure with ERC-8004 identity and x402 payments

FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -g 1001 -S receipts && \
    adduser -S receipts -u 1001 -G receipts

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY capture.js ./
COPY SKILL.md ./

# Create data directory for persistent storage
RUN mkdir -p /data/receipts && \
    chown -R receipts:receipts /data

# Environment configuration
ENV NODE_ENV=production
ENV RECEIPTS_DATA_DIR=/data/receipts

# Default port for HTTP server mode
ENV PORT=3000
EXPOSE 3000

# Switch to non-root user
USER receipts

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node capture.js identity show || exit 1

# Default command: serve mode (HTTP API)
CMD ["node", "capture.js", "serve"]
