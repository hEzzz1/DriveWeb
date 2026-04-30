# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

ARG RUN_TYPECHECK=false

COPY package*.json ./
RUN npm ci

COPY . .

# Keep image builds focused on asset bundling.
# Type checking can be enabled explicitly when needed.
RUN if [ "$RUN_TYPECHECK" = "true" ]; then npm run typecheck; fi
RUN npm run build:bundle

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
