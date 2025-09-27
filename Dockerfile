FROM node:22-alpine AS deps
RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat python3 cmake g++ && \
    rm -rf /var/cache/apk/*
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
#RUN yarn install --frozen-lockfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY next.config.js ./
COPY src ./src
COPY public ./public
#RUN yarn build
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Standalone 빌드 활용으로 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# BUILD ARGUMENTS
ARG VERSION
ENV VERSION $VERSION
ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP $BUILD_TIMESTAMP

EXPOSE 3000
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["node", "server.js"]
