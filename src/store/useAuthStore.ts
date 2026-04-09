import {create} from 'zustand'
import forge from 'node-forge'
import service from '../service'
import type {User} from '@/types/user'

interface AuthState {
    isAuthenticated: boolean | null
    isLoading: boolean
    user: User | Record<string, never>
    error: string
}

interface AuthActions {
    login: (username: string, password: string) => Promise<void>
    loadProfile: () => Promise<void>
    setProfileFromServer: (user: User) => void
    setError: (msg: string) => void
    clearError: () => void
}

function encryptPassword(resPublicKey: string, pass: string): string {
    try {
        const publicKey = forge.pki.publicKeyFromPem('-----BEGIN PUBLIC KEY----- ' + resPublicKey + ' -----END PUBLIC KEY-----')
        const encData = publicKey.encrypt(pass, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {md: forge.md.sha1.create()}
        })
        return forge.util.encode64(encData)
    } catch (err) {
        return String(err)
    }
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    isAuthenticated: null,
    isLoading: false,
    user: {},
    error: '',

    login: async (username, password) => {
        set({isLoading: true, error: ''})
        try {
            const rsa = await service.user.shake()
            const publicKey = rsa.data.publicKey
            const encPassword = encryptPassword(publicKey, password)
            const auth = await service.user.login({username, encPassword, publicKey})
            set({isLoading: false, isAuthenticated: true, user: auth.data, error: ''})
        } catch {
            set({isLoading: false, isAuthenticated: false, error: 'Login failed'})
        }
    },

    loadProfile: async () => {
        try {
            const auth = await service.user.profile()
            set({isAuthenticated: true, user: auth.data, error: ''})
        } catch {
            set({isAuthenticated: false, user: {}, error: ''})
        }
    },

    setProfileFromServer: (user) => {
        set({isAuthenticated: true, user, error: ''})
    },

    setError: (msg) => set({error: msg}),
    clearError: () => set({error: ''}),
}))
