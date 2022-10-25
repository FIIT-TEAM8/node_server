FROM fiitteam8/node_with_chromium:1.0.0

WORKDIR /myApp

COPY package*.json ./

RUN npm install

COPY ./ ./

EXPOSE 8080

ENV NODE_ENV=production

CMD npm run deploy