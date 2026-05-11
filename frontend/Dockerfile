# Stage 1: Build the SPA
FROM node:20 as build

ARG SENTRY_AUTH_TOKEN

WORKDIR /app

# Copy and build shared library first
COPY shared ./shared
WORKDIR /app/shared
RUN yarn install
RUN yarn build

# Copy and build frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install

COPY frontend/ .
RUN rm src/config/environment.ts; cp src/config/environment.ts.dist src/config/environment.ts
RUN yarn build

# Stage 2: Serve the SPA with NGINX
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/frontend/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]