ARG BASE_IMAGE_NAME=node
ARG BASE_IMAGE_TAG=24-alpine

# deps: lockfile 만으로 pnpm 스토어를 캐시한다 — 패키지 추가 시 Dockerfile 수정 불필요
FROM ${BASE_IMAGE_NAME}:${BASE_IMAGE_TAG} AS deps
# corepack 은 Node 25 부터 제거 예정이라 배제하고 pnpm 을 직접 설치한다 (deleo 관례)
RUN npm install -g pnpm@11.20.0
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

FROM deps AS build
COPY . .
RUN pnpm install --frozen-lockfile --offline
ENV NEXT_TELEMETRY_DISABLED=1
# VERSION(커밋 SHA 7자리)은 GlitchTip release 식별자로도 쓴다 — 이미지 태그·이벤트·소스맵 정렬
ARG VERSION
ARG SENTRY_URL=https://glitchtip.hvy.kr
# ui-docs 는 로컬 전용 — blog 앱만 빌드한다
# SENTRY_AUTH_TOKEN 은 BuildKit secret — 이미지 레이어에 남지 않고, 없으면 소스맵 업로드만 스킵된다
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    pnpm -F blog build

FROM ${BASE_IMAGE_NAME}:${BASE_IMAGE_TAG} AS runner
WORKDIR /app

# 기본값: 외부 설정이 없으면 힙 메모리 384MB로 제한 (Sentry SDK+OTel 상주 메모리 감안, docker stats 로 재검증)
ENV NODE_OPTIONS="--max-old-space-size=384" \
    NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# standalone 산출물의 server.js 경로는 모노레포 기준 apps/blog/server.js 로 바뀐다.
# public 은 standalone 에 포함되지 않으므로 별도 복사한다.
COPY --from=build --chown=node:node /app/apps/blog/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/blog/.next/static ./apps/blog/.next/static
COPY --from=build --chown=node:node /app/apps/blog/public ./apps/blog/public

USER node

# BUILD ARGUMENTS
ARG VERSION
ENV VERSION=$VERSION
ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP

EXPOSE 3000

CMD ["node", "apps/blog/server.js"]
