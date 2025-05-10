# 0단계: 현재 프로젝트의 의존성 중 업데이트가 필요한 패키지 목록 확인
npm outdated

# 1단계: 호환성 업데이트
npm update

# 패키지 보안 취약점 확인 및 수정(가능하면 --force 옵션 사용하지 말 것)
npm audit
npm audit fix


# 2단계: Next.js 13 최신 버전으로 업데이트
npm install next@13.5.11 eslint-config-next@13.5.11

# 앱 테스트
npm run dev

# 5단계: Node.js 버전 업데이트 (로컬에서만)
nvm install 22
nvm use 22

# 앱 테스트
npm run dev

# 6단계: Next.js 최신 버전으로 업데이트 (마이그레이션 가이드 참고 필요)
# https://nextjs.org/docs/pages/guides/upgrading
# react-redux가 아직 react 19를 지원하지 않는 것으로 보여서 next.js 14까지만 업그레이드 하는 것으로.
## https://nextjs.org/docs/app/guides/upgrading/version-15
npm i next@next-14 react@18 react-dom@18 && npm i eslint-config-next@next-14 -D

# 앱 테스트
npm run dev