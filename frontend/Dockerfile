FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

# No build args: the app fetches its auth config from the backend at runtime, so
# one image works against any Zitadel instance.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
