# Stage 1: Build the server
FROM node:20-alpine

ARG SENTRY_AUTH_TOKEN

WORKDIR /app

COPY . .
RUN yarn install
RUN yarn build

CMD ["node", "./dist/src/index.js"]
EXPOSE 80
