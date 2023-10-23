FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY src /usr/src/app
CMD npm run start