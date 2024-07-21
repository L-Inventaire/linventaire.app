# Stage 1: Build the SPA
FROM node:20 as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN rm src/config/environment.ts; cp src/config/environment.ts.dist src/config/environment.ts
RUN yarn build

# Stage 2: Serve the SPA with NGINX
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]