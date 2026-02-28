// process.env.BLOG_URL_DEV ||= 'http://localhost:9090'
process.env.BLOG_URL_DEV ||= 'https://api.hvy.kr'
process.env.BLOG_URL_PROD ||= 'https://api.hvy.kr'
process.env.BLOG_URL_PROD_INTERNAL ||= 'http://blogback:8080'
process.env.META_URL ||= 'https://hvy.kr'
process.env.JIRA_BROWSE_URL ||= 'https://deleokorea.atlassian.net/browse'

module.exports = {
    output: 'standalone',
    env: {
        META_URL: process.env.META_URL,
        JIRA_BROWSE_URL: process.env.JIRA_BROWSE_URL,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                ],
            },
        ]
    },
}
