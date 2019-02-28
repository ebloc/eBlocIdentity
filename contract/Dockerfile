FROM node:10-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g truffle
COPY . .
CMD truffle migrate && truffle test test/root_test.js test/group_test.js
