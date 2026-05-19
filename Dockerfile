FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .


ARG ANGULAR_API_URL=http://localhost:8080/api/v1
ENV ANGULAR_API_URL=$ANGULAR_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/luxe-stay-front-admin /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
