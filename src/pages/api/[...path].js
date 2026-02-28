import httpProxy from 'http-proxy'
import {getAuthTokenFromRequest} from '../../lib/authCookie'
import {getBackendBaseUrl} from '../../lib/backendUrl'

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
}

export default async function handler(req, res) {
  const token = getAuthTokenFromRequest(req)

  await proxyRequest(req, res, {
    target: getBackendBaseUrl(),
    token
  })
}

function proxyRequest(req, res, {target, token}) {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true
  })

  return new Promise((resolve) => {
    let settled = false

    const finish = () => {
      if (settled) {
        return
      }
      settled = true
      proxy.removeAllListeners()
      res.off('finish', finish)
      res.off('close', finish)
      resolve()
    }

    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('cookie')
      if (token) {
        proxyReq.setHeader('Authorization', `Bearer ${token}`)
      } else {
        proxyReq.removeHeader('Authorization')
      }
    })

    proxy.on('proxyRes', (proxyRes) => {
      delete proxyRes.headers['set-cookie']
    })

    proxy.on('error', (error) => {
      console.error('BFF proxy failed:', error)
      if (!res.headersSent) {
        res.status(502).json({message: 'Bad Gateway'})
      } else {
        res.end()
      }
      finish()
    })

    res.on('finish', finish)
    res.on('close', finish)

    proxy.web(req, res, {target})
  })
}
