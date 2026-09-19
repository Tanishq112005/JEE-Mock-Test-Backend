# ==========================================
# STAGE 1: BUILDER (The Workshop)
# ==========================================
FROM node:20-alpine AS builder 
WORKDIR /app

# Pehle sirf package files copy karein (layer caching ke liye)
COPY package*.json ./

# Saari dependencies install karein (dev + prod)
RUN npm install

# Ab saara source code copy karein
COPY . .

# Code ko compile/build karein
RUN DATABASE_URL="mysql://root:password@localhost:3306/dummy" DATABASE_URL_PRODUCTION="mysql://root:password@localhost:3306/dummy" npm run build

# THE MAGIC TRICK: Build hone ke baad saari 'devDependencies' delete kar dein
RUN npm prune --production


# ==========================================
# STAGE 2: DEV (Optional, local testing ke liye)
# ==========================================
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3005
CMD ["npm", "run", "start:dev"]


# ==========================================
# STAGE 3: PROD (The Lightweight Showroom)
# ==========================================
FROM node:20-alpine AS prod 
WORKDIR /app

# Sirf zaroori files builder se copy karein
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Yahan maan lijiye aapka build output 'dist' ya 'build' folder mein aata hai
# Agar aapka build folder ka naam kuch aur hai, toh 'dist' ko usse replace kar dein
COPY --from=builder /app/dist ./dist 

EXPOSE 3005
CMD ["npm", "run", "start:prod"]