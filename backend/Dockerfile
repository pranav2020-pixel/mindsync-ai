FROM node:20

WORKDIR /app

# Install OpenSSL libraries for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
