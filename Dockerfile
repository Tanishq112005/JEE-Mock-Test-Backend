FROM node:22-bullseye-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the project (generates Prisma client and compiles TS to JS)
RUN npm run build

# Expose port
EXPOSE 7860

# Start the API server
CMD ["npm", "run", "start:prod"]
