const BACKEND_URL = {
    BLOG_URL_DEV: 'http://localhost:9090',
    // BLOG_URL_DEV: 'https://api.hvy.kr',
    BLOG_URL_PROD: 'https://api.hvy.kr',
    BLOG_URL_PROD_INTERNAL: 'http://blogback:8080',
}

module.exports = {
    output: 'standalone',
    env: {
        BLOG_URL_DEV: BACKEND_URL.BLOG_URL_DEV,
        BLOG_URL_PROD: BACKEND_URL.BLOG_URL_PROD,
        META_URL: 'https://hvy.kr',
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production' ?
                    (BACKEND_URL.BLOG_URL_PROD_INTERNAL + '/api/:path*') :
                    (BACKEND_URL.BLOG_URL_DEV + '/api/:path*')
            }
        ]
    }
}