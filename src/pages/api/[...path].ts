import {getAuthTokenFromRequest} from '../../lib/authCookie'
import {getBackendBaseUrl} from '../../lib/backendUrl'
import {Readable} from 'node:stream'
import type {NextApiRequest, NextApiResponse} from 'next'

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
}

function toReadableStream(req: NextApiRequest): ReadableStream<Uint8Array> {
  return Readable.toWeb(req) as ReadableStream<Uint8Array>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getAuthTokenFromRequest(req)
  const target = getBackendBaseUrl()
  const url = `${target}${req.url}`

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'cookie' || key === 'host') continue
    if (typeof value === 'string') headers[key] = value
  }
  if (token) {
    headers['authorization'] = `Bearer ${token}`
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? toReadableStream(req) : undefined,
      // @ts-expect-error Node.js fetch supports duplex for streaming request bodies
      duplex: hasBody ? 'half' : undefined,
    })

    res.status(upstream.status)
    for (const [key, value] of upstream.headers.entries()) {
      if (key === 'set-cookie' || key === 'transfer-encoding') continue
      res.setHeader(key, value)
    }

    if (upstream.body) {
      const reader = upstream.body.getReader()
      try {
        while (true) {
          const {done, value} = await reader.read()
          if (done) break
          res.write(value)
        }
      } finally {
        reader.releaseLock()
      }
    }
    res.end()
  } catch (error) {
    console.error('BFF proxy failed:', error)
    if (!res.headersSent) {
      res.status(502).json({message: 'Bad Gateway'})
    } else {
      res.end()
    }
  }
}
