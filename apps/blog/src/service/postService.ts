import type { AxiosRequestConfig } from 'axios';
import type { Post, SearchAllParam } from '@/types/post';
import { base64Encode } from '@/util/base64Util';
import axiosClient from './axiosClient';

const postService = {
  mainPost: (config?: AxiosRequestConfig) => {
    return axiosClient.get(`/api/post`, config);
  },
  getPost: ({ postId }: { postId: string }, config?: AxiosRequestConfig) => {
    return axiosClient.get(`/api/post/${postId}`, config);
  },
  getPrevNext: ({ postId }: { postId: string }, config?: AxiosRequestConfig) => {
    return axiosClient.get(`/api/post/prev-next/${postId}`, config);
  },
  deletePost: ({ postId }: { postId: string }, config?: AxiosRequestConfig) => {
    return axiosClient.delete(`/api/post/admin/${postId}`, config);
  },
  setPublicPost: (
    { postId, publicStatus }: { postId: string; publicStatus: boolean },
    config?: AxiosRequestConfig,
  ) => {
    return axiosClient.post(
      `/api/post/admin/public`,
      {
        id: postId,
        publicStatus: publicStatus,
      },
      config,
    );
  },
  deleteTag: (
    { postId, tagId }: { postId: string; tagId: string },
    config?: AxiosRequestConfig,
  ) => {
    return axiosClient.delete(`/api/post/admin/${postId}/tag/${tagId}`, config);
  },
  addTag: (
    { postId, tagName }: { postId: string; tagName: string },
    config?: AxiosRequestConfig,
  ) => {
    return axiosClient.post(
      `/api/post/admin/${postId}/tag`,
      {
        name: tagName,
      },
      config,
    );
  },
  search: ({ searchAllParam }: { searchAllParam: SearchAllParam }, config?: AxiosRequestConfig) => {
    return axiosClient.get('/api/post/search', {
      params: {
        query: base64Encode(JSON.stringify(searchAllParam)),
      },
      ...(config || {}),
    });
  },
  /**
   * 관리자 글 목록 검색 — 임시저장·비공개 글을 포함한다.
   *
   * 공개 검색(search)의 base64 GET 을 쓰지 않는 이유: useServerGrid 가 보내는 평평한
   * 검색 파라미터를 SearchObject 의 중첩 구조로 변환하는 계층이 이 화면에만 생긴다.
   * 다른 관리자 그리드와 같은 POST + PageRequest 규약을 따른다.
   *
   * `.data` 로 벗겨서 반환하는 것이 중요하다 — useServerGrid 는 `response.list` /
   * `response.totalCount` 를 읽는다(logService·memoService 와 동일).
   */
  adminSearch: async (
    { searchRequest }: { searchRequest: Record<string, unknown> },
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.post('/api/post/admin/search', searchRequest, config);
    return response.data;
  },
  getRelatedPosts: ({ postId }: { postId: string }, config?: AxiosRequestConfig) => {
    return axiosClient.get(`/api/post/${postId}/related`, config);
  },
  new: (config?: AxiosRequestConfig) => {
    return axiosClient.post('/api/post/admin', undefined, config);
  },
  save: ({ post }: { post: Post }, config?: AxiosRequestConfig) => {
    return axiosClient.put(`/api/post/admin/${post.id}`, post, config);
  },
  deleteDraft: ({ postId }: { postId: string }, config?: AxiosRequestConfig) => {
    return axiosClient.delete(`/api/post/admin/${postId}/draft`, config);
  },
};

export default postService;
