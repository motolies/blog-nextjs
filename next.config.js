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
            // {
            //     source: '/api/file/:path',
            //     destination: process.env.NODE_ENV === 'production' ?
            //         (BACKEND_URL.BLOG_URL_PROD + '/api/file/:path') :
            //         (BACKEND_URL.BLOG_URL_DEV + '/api/file/:path')
            // },
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production' ?
                    (BACKEND_URL.BLOG_URL_PROD + '/api/:path*') :
                    (BACKEND_URL.BLOG_URL_DEV + '/api/:path*')
            }
        ]
    }
}