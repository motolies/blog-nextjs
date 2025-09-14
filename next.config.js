const BACKEND_URL = {
    // BLOG_URL_DEV: 'http://localhost:9090',
    BLOG_URL_DEV: 'https://api.hvy.kr',
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
    experimental: {
        esmExternals: 'loose'
    },
    transpilePackages: ['@mui/x-data-grid'],
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // CSS 로더 설정은 이미 Next.js가 관리하므로 제거
        return config
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