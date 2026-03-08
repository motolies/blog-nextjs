const DEFAULT_BLOG_URL_DEV = 'https://api.hvy.kr'
const DEFAULT_BLOG_URL_PROD = 'http://blogback:8080'

export function getBackendBaseUrl() {
  // standalone 서버는 next.config.js의 process.env 변경을 런타임에 다시 적용하지 않는다.
  const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.BLOG_URL_PROD || DEFAULT_BLOG_URL_PROD
      : process.env.BLOG_URL_DEV || DEFAULT_BLOG_URL_DEV

  if (!baseUrl) {
    throw new Error('Backend base URL is not configured.')
  }

  return baseUrl.replace(/\/$/, '')
}
