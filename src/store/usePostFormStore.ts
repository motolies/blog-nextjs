import {create} from 'zustand'
import service from '../service'
import type {Post} from '@/types/post'

const modifyPostInit: Post = {
    id: null,
    subject: '',
    body: '',
    category: {id: 'ROOT'},
    categoryId: 'ROOT',
    public: false,
    status: 'TEMP',
    tags: [],
    files: [],
}

interface PostFormState {
    post: Post
    isLoading: boolean
}

interface PostFormActions {
    loadForModify: (postId?: string) => Promise<void>
    setSubject: (subject: string) => void
    setCategoryId: (categoryId: string) => void
    setBody: (body: string) => void
    setPublic: (isPublic: boolean) => void
    reset: () => void
}

export const usePostFormStore = create<PostFormState & PostFormActions>((set) => ({
    post: modifyPostInit,
    isLoading: false,

    loadForModify: async (postId) => {
        set({isLoading: true, post: modifyPostInit})
        try {
            if (postId) {
                const res = await service.post.getPost({postId})
                const post = res.data
                if (post.draftSubject != null) {
                    post.subject = post.draftSubject
                    post.body = post.draftBody ?? ''
                }
                set({isLoading: false, post})
            } else {
                const res = await service.post.new()
                set({isLoading: false, post: res.data})
            }
        } catch {
            set({isLoading: false, post: modifyPostInit})
        }
    },

    setSubject: (subject) => set((state) => ({
        post: {...state.post, subject}
    })),

    setCategoryId: (categoryId) => set((state) => ({
        post: {...state.post, categoryId, category: {id: categoryId}}
    })),

    setBody: (body) => set((state) => ({
        post: {...state.post, body}
    })),

    setPublic: (isPublic) => set((state) => ({
        post: {...state.post, public: isPublic}
    })),

    reset: () => set({post: modifyPostInit, isLoading: false}),
}))
