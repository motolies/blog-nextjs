import {
  POST_LOAD_FOR_MODIFY_REQUEST,
  POST_LOAD_FOR_MODIFY_REQUEST_ERROR,
  POST_LOAD_FOR_MODIFY_REQUEST_SUCCESS,
  POST_LOCAL_MODIFY_BODY_SUCCESS,
  POST_LOCAL_MODIFY_CATEGORY_ID_SUCCESS,
  POST_LOCAL_MODIFY_PUBLIC_SUCCESS,
  POST_LOCAL_MODIFY_SUBJECT_SUCCESS,
  POST_SEARCH_REQUEST,
  POST_SEARCH_REQUEST_ERROR,
  POST_SEARCH_REQUEST_SUCCESS,
} from "../types/postTypes"
import {FILE_LIST_BY_POST_REQUEST_ERROR, FILE_LIST_BY_POST_REQUEST_SUCCESS} from "../types/fileTypes"
import type { PostState } from '@/types/store'
import type { Post } from '@/types/post'

const modifyPostInit: Post = {
  id: null,
  subject: "",
  body: "",
  category: {
    id: "ROOT"
  },
  categoryId: "ROOT",
  public: false,
  tags: [],
  files: []
}

const initialState: PostState = {
  isLoading: false,
  searchedPost: {},
  modifyPost: modifyPostInit,
  error: ''
}

export default function postReducers(stats: PostState = initialState, action: { type: string; payload?: unknown }): PostState {
  switch (action.type) {

    case POST_SEARCH_REQUEST:
      return {
        ...stats,
        isLoading: true
      }
    case POST_SEARCH_REQUEST_SUCCESS:
      return {
        ...stats,
        isLoading: false,
        searchedPost: action.payload as PostState['searchedPost']
      }
    case POST_SEARCH_REQUEST_ERROR:
      return {
        ...stats,
        isLoading: false,
        searchedPost: {}
      }
    case POST_LOAD_FOR_MODIFY_REQUEST:
      return {
        ...stats,
        isLoading: true,
        modifyPost: modifyPostInit
      }
    case POST_LOAD_FOR_MODIFY_REQUEST_SUCCESS:
      return {
        ...stats,
        isLoading: false,
        modifyPost: action.payload as Post
      }
    case POST_LOAD_FOR_MODIFY_REQUEST_ERROR:
      return {
        ...stats,
        isLoading: false,
        modifyPost: modifyPostInit
      }
    case POST_LOCAL_MODIFY_SUBJECT_SUCCESS:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, subject: action.payload as string
        }
      }
    case POST_LOCAL_MODIFY_CATEGORY_ID_SUCCESS:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, categoryId: action.payload as string, category: {id: action.payload as string}
        }
      }
    case POST_LOCAL_MODIFY_BODY_SUCCESS:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, body: action.payload as string
        }
      }
    case POST_LOCAL_MODIFY_PUBLIC_SUCCESS:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, public: action.payload as boolean
        }
      }
    case FILE_LIST_BY_POST_REQUEST_SUCCESS:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, files: action.payload as Post['files']
        }
      }
    case FILE_LIST_BY_POST_REQUEST_ERROR:
      return {
        ...stats,
        modifyPost: {
          ...stats.modifyPost, files: []
        }
      }
    default:
      return stats
  }
}
