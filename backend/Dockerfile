FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "start:dev"]
