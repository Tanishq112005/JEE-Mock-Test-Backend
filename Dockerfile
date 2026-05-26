FROM node:20 AS base  

WORKDIR /app

COPY package*.json ./

RUN npm  install 

COPY . .

RUN DATABASE_URL="mysql://root:password@localhost:3306/dummy" npx prisma generate
RUN npm run build

EXPOSE 3005

FROM base AS dev
CMD ["npm", "run", "start:dev"]


FROM base AS prod 
CMD ["npm" , "run" , "start:prod"] 
