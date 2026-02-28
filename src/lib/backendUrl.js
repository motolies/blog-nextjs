export function getBackendBaseUrl() {
  const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.BLOG_URL_PROD_INTERNAL || process.env.BLOG_URL_PROD
      : process.env.BLOG_URL_DEV

  if (!baseUrl) {
    throw new Error('Backend base URL is not configured.')
  }

  return baseUrl.replace(/\/$/, '')
}
