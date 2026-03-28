FROM nginx:1.25
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend         /usr/share/nginx/html
COPY admin            /usr/share/nginx/admin
