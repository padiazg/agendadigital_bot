FROM node:10-alpine

WORKDIR /app
COPY package.json ./

RUN apk --no-cache add git yarn \
  && echo "Installing node.js modules" \
  && yarn install \
  && echo "Cleaning up" \
  && apk del git yarn

COPY src/ ./src/

CMD ["node", "src"]
