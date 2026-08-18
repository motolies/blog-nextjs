export interface User {
  username: string
  [key: string]: unknown
}

export interface LoginRequest {
  username: string
  encPassword: string
  publicKey: string
}

export interface ShakeResponse {
  publicKey: string
}
