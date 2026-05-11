# Stage 1: Build the server
FROM node:20-alpine

ARG SENTRY_AUTH_TOKEN

WORKDIR /app

# Copy shared library first
COPY shared ./shared
WORKDIR /app/shared
RUN yarn install
RUN yarn build

# Copy and build backend
WORKDIR /app/backend
COPY backend .
RUN yarn install
RUN yarn build

CMD ["node", "./dist/src/index.js"]
EXPOSE 80
