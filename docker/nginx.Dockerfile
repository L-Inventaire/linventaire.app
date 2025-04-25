FROM nginx:stable-alpine

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/site.conf /etc/nginx/sites-enabled/site.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
