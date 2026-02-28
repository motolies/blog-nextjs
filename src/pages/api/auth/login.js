import axios from 'axios'
import {buildAuthCookie, extractBackendAuthCookie} from '../../../lib/authCookie'
import {getBackendBaseUrl} from '../../../lib/backendUrl'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  try {
    const response = await axios.post(
        `${getBackendBaseUrl()}/api/auth/login`,
        req.body,
        {
          headers: {
            Accept: req.headers.accept || 'application/json',
            'Content-Type': req.headers['content-type'] || 'application/json'
          },
          validateStatus: () => true
        }
    )

    if (response.status === 200) {
      const authCookie = extractBackendAuthCookie(response.headers['set-cookie'])
      if (!authCookie?.value) {
        return res.status(502).json({
          message: 'Backend login succeeded without auth token cookie.'
        })
      }

      res.setHeader('Set-Cookie', buildAuthCookie(authCookie.value, {maxAge: authCookie.maxAge}))
    }

    return sendBackendResponse(res, response.status, response.data)
  } catch (error) {
    console.error('BFF login proxy failed:', error)
    return res.status(502).json({message: 'Bad Gateway'})
  }
}

function sendBackendResponse(res, status, data) {
  if (data === undefined || data === null) {
    return res.status(status).end()
  }

  if (Buffer.isBuffer(data) || typeof data === 'string') {
    return res.status(status).send(data)
  }

  return res.status(status).json(data)
}
