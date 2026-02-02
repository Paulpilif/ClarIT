FROM node:20-alpine AS BUILDER

WORKDIR /app
COPY /web/package.json /web/package-lock.json ./
RUN npm ci

COPY /web .

RUN npx vite build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY /web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

