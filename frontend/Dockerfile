# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm (version matches the packageManager field in package.json)
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

# Accept build arg for API URL.
# Empty default = relative /api, proxied to the backend by nginx.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_ZITADEL_AUTHORITY=
ENV VITE_ZITADEL_AUTHORITY=$VITE_ZITADEL_AUTHORITY
ARG VITE_ZITADEL_CLIENT_ID=
ENV VITE_ZITADEL_CLIENT_ID=$VITE_ZITADEL_CLIENT_ID
ARG VITE_ZITADEL_REDIRECT_URI=
ENV VITE_ZITADEL_REDIRECT_URI=$VITE_ZITADEL_REDIRECT_URI
ARG VITE_ZITADEL_POST_LOGOUT_URI=
ENV VITE_ZITADEL_POST_LOGOUT_URI=$VITE_ZITADEL_POST_LOGOUT_URI

# Copy dependency files
COPY pnpm-lock.yaml* package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
