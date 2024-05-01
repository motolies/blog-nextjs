const BACKEND_URL = {
    BLOG_URL_DEV: 'http://localhost:9090',
    BLOG_URL_PROD: 'https://api.hvy.kr',
}

module.exports = {
    env: {
        BLOG_URL_DEV: BACKEND_URL.BLOG_URL_DEV,
        BLOG_URL_PROD: BACKEND_URL.BLOG_URL_PROD,
        META_URL: 'https://hvy.kr',
    },
    async rewrites() {
        return [
            {
                // 이미지 가지고 올 때 사용 중
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production' ?
                    (BACKEND_URL.BLOG_URL_PROD + '/api/:path*') :
                    (BACKEND_URL.BLOG_URL_DEV + '/api/:path*')
            }
        ]
    }
}