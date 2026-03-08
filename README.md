# blog-nextjs

개인 블로그 Next.js 프론트엔드 애플리케이션

## 📚 문서

- [인증 시스템 (Authentication)](./docs/authentication.md) - 쿠키 기반 인증 구조 및 SSR/CSR 플로우

## 사용법

```shell
npm ci
npm run dev
```

---

## 빌드

### 다중 아키텍처 빌드시

```shell
# 기본 docker buildx 로는 바로 빌드가 되지 않는다.
# 그래서 신규로 하나 생성하여 주자
docker buildx create --name jarvis \
&& docker buildx use jarvis \
&& docker buildx inspect --bootstrap

# -t 옵션을 붙이면 tag를 추가해서 업로드 가능하다
docker buildx build --platform linux/amd64,linux/arm64 --no-cache --push -t docker.hvy.kr/blog-front  .

docker buildx build --platform linux/amd64 --no-cache --push -t docker.hvy.kr/blog-front  .
```

### 단일 빌드시
```shell
# 빌드
docker build --no-cache -t docker.hvy.kr/blog-front .

# 이미지 푸쉬
docker push --all-tags docker.hvy.kr/blog-front
```

## 실행

`output: 'standalone'` 빌드는 컨테이너 런타임의 `BLOG_URL_PROD`를 읽습니다.
또한 `blogfront`와 `blogback`은 같은 사용자 정의 Docker 네트워크에 연결되어 있어야 `http://blogback:8080`이 해석됩니다.

```shell
# 삭제
docker rm -f blogfront


# 네트워크(최초 1회)
docker network create prod_back_network


# 실행(테스트용)
docker run -d --restart=unless-stopped \
--pull always \
-e BLOG_URL_PROD=http://blogback:8080 \
--network prod_back_network \
-p 3000:3000 \
--name blogfront docker.hvy.kr/blog-front

# 실행(테스트용 - windows)
docker run -d --restart=unless-stopped --pull always -e BLOG_URL_PROD=http://host.docker.internal:9090 -p 3000:3000 --name blogfront docker.hvy.kr/blog-front

# 실행(프로덕션)
docker run -d --restart=unless-stopped \
--pull always \
-e BLOG_URL_PROD=http://blogback:8080 \
--network prod_back_network \
-p 3000:3000 \
--name blogfront docker.hvy.kr/blog-front
```

`blogback` 컨테이너도 동일하게 `prod_back_network`에 붙어 있어야 합니다.
