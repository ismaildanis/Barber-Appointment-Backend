FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build  

EXPOSE 3001
CMD ["node", "dist/main.js"]

