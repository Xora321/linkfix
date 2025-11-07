FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY server.js ./

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]