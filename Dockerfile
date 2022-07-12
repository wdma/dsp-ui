FROM node:current-alpine

WORKDIR /home/node/app

COPY ./ ./

RUN npm install

USER node

COPY --chown=node:node . .

EXPOSE 8080

CMD [ "npm", "start" ]
