# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Accept build arg for API URL
ARG VITE_API_URL=http://localhost:8000
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
