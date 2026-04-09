import httpProxy from 'http-proxy'
import {getAuthTokenFromRequest} from '../../lib/authCookie'
import {getBackendBaseUrl} from '../../lib/backendUrl'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { IncomingMessage, ServerResponse } from 'http'

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getAuthTokenFromRequest(req)

  await proxyRequest(req, res, {
    target: getBackendBaseUrl(),
    token
  })
}

function proxyRequest(req: IncomingMessage, res: ServerResponse, {target, token}: { target: string; token: string | null }) {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true
  })

  return new Promise<void>((resolve) => {
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
        (res as NextApiResponse).status(502).json({message: 'Bad Gateway'})
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
