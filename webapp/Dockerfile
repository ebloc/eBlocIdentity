FROM node:10-alpine
RUN apk add --no-cache build-base python git
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon
COPY . .
EXPOSE 8080
CMD nodemon ./bin/www
