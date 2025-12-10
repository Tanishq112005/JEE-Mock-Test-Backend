FROM node:20 AS base  

WORKDIR /app

COPY package*.json ./

RUN npm  install 

COPY . .

RUN npm run build

EXPOSE 3000

FROM base AS dev
CMD ["npm", "run", "start:dev"]


FROM base AS prod 
CMD ["npm" , "run" , "start:prod"] 




