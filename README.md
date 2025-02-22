# CKEditor5 

- https://velog.io/@kbm940526/Ckeditor-with-Next-js-%EB%AF%B8%EC%99%84
- https://stackoverflow.com/questions/62243323/reactjs-import-ckeditor-5-from-online-build

## 사용법
```shell
# ckeditor5를 먼저 빌드 한 후에
cd ckeditor5
npm ci
npm run build

# 메인 소스에 포함시킨다.
cd ..
npm add file:./ckeditor5
```
<br>

---

<br>

# blog-nextjs

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


```shell
# 삭제
docker rm -f blogfront


# 실행(테스트용)
docker run -d --restart=unless-stopped \
--pull always \
-p 3000:3000 \
--link blogback \
--name blogfront docker.hvy.kr/blog-front

# 실행(테스트용 - windows)
docker run -d --restart=unless-stopped --pull always -p 3000:3000 --name blogfront docker.hvy.kr/blog-front

# 실행(프로덕션)
docker run -d --restart=unless-stopped \
--pull always \
-p 3000:3000 \
--link blogback \
--name blogfront docker.hvy.kr/blog-front
```

