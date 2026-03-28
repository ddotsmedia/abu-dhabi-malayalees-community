FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ../frontend /usr/share/nginx/html
COPY ../admin    /usr/share/nginx/admin
