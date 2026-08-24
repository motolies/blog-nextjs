import { Button, showToast, useConfirm } from '@hvy/ui';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Globe,
  GlobeLock,
  List,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCodeHighlight } from '@/hooks/useCodeHighlight';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { searchObjectInit } from '@/model/searchObject';
import service from '@/service';
import { useAuthStore } from '@/store/useAuthStore';
import type { Series } from '@/types/series';
import type { Tag } from '@/types/tag';
import { base64Encode } from '@/util/base64Util';
import { sanitizeThemeHostileStyles } from '@/util/contentStyleSanitizer';
import { formatLocalDate, formatUtcToLocal } from '@/util/dateTimeUtil';
import { fileLink } from '@/util/fileLink';
import { usePostNavigationShortcut } from '@/util/usePostNavigationShortcut';
import TableOfContents from './TableOfContents';
import TagGroupComponent from './TagGroupComponent';

interface PostData {
  id: number;
  subject: string;
  body: string;
  category: {
    id: string;
    name: string;
  };
  public: boolean;
  status?: 'TEMP' | 'PUBLISH';
  tags: Tag[];
  created: { at: string };
  updated: { at: string };
}

interface PrevNext {
  prev: number;
  next: number;
  prevSubject?: string;
  nextSubject?: string;
}

interface RelatedPost {
  id: number;
  subject: string;
  categoryName: string;
  createDate: string;
  commonTagCount: number;
}

interface PostComponentProps {
  post: PostData;
  prevNext: PrevNext;
}

export default function PostComponent({ post, prevNext }: PostComponentProps) {
  const router = useRouter();
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );

  const askConfirm = useConfirm();
  const [postPublic, setPostPublic] = useState<boolean | undefined>(post?.public);
  const [tags, setTags] = useState<Tag[]>(post?.tags || []);
  const [postBody, setPostBody] = useState<string>('');
  const [isClientMounted, setIsClientMounted] = useState<boolean>(false);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [series, setSeries] = useState<Series | null>(null);
  const [seriesExpanded, setSeriesExpanded] = useState<boolean>(false);

  const prevPostId = prevNext?.prev || 0;
  const nextPostId = prevNext?.next || 0;

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'ArrowLeft' && prevPostId !== 0) {
      router.push(`/post/${prevPostId}`);
    } else if (event.ctrlKey && event.key === 'ArrowRight' && nextPostId !== 0) {
      router.push(`/post/${nextPostId}`);
    }
  };

  usePostNavigationShortcut(['ArrowLeft', 'ArrowRight'], onKeyPress);
  useCodeHighlight(postBody);

  useEffect(() => {
    setPostPublic(post?.public);
    setTags(post?.tags || []);
  }, [post]);

  useEffect(() => {
    if (post?.id && post.id > 0) {
      service.post
        .getRelatedPosts({ postId: String(post.id) })
        .then((res: { data: RelatedPost[] }) => setRelatedPosts(res.data ?? []))
        .catch(() => setRelatedPosts([]));

      service.series
        .getByPostId({ postId: String(post.id) })
        .then((res: { data: Series | null }) => {
          const data = res.data;
          setSeries(data?.id ? data : null);
        })
        .catch(() => setSeries(null));
    }
  }, [post?.id]);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (!postBody) {
      return;
    }
    postImagePopup();
    postIconChange();
  }, [postBody]);

  useEffect(() => {
    if (!post?.body) {
      setPostBody('');
      return;
    }
    const doc = new DOMParser().parseFromString(post.body, 'text/html');
    // 정화 정책이 IDE 코드 블록의 어두운 배경을 유지하므로 initVsCode 등의 배경색 감지가 그대로 동작한다
    sanitizeThemeHostileStyles(doc.body);
    initVsCode(doc);
    initJetbrains(doc);
    initIntellij(doc);
    initLinkNewTab(doc);
    wrapTables(doc);
    setPostBody(doc.head.innerHTML + doc.body.innerHTML);
  }, [post?.body]);

  // React 19는 재렌더 커밋마다 같은 __html이라도 innerHTML을 재세팅해, 렌더 후 DOM에 주입한
  // 헤딩 id(목차)·IntersectionObserver 관찰 노드·이미지 팝업 리스너가 전부 소멸한다.
  // 요소 참조를 고정해 postBody가 바뀔 때만 서브트리가 다시 커밋되도록 한다.
  const postContent = useMemo(
    () => (
      <div
        className="content break-words"
        id="post-content"
        dangerouslySetInnerHTML={{ __html: postBody }}
      />
    ),
    [postBody],
  );

  // 넓은 표가 모바일에서 잘리지 않도록 가로 스크롤 래퍼(.table-scroll)로 감싼다.
  // CSS 만으로는 래퍼를 만들 수 없어 기존 DOM 후처리 파이프라인에서 처리한다.
  const wrapTables = (doc: Document) => {
    doc.body.querySelectorAll('table').forEach((table) => {
      // 중첩 표는 바깥 표의 스크롤 컨테이너를 따르므로 건너뛴다
      if (table.parentElement?.closest('table')) {
        return;
      }
      if (table.parentElement?.classList.contains('table-scroll')) {
        return;
      }
      const wrapper = doc.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  };

  const postIconChange = () => {
    document.querySelectorAll('i.fa-file').forEach((icon) => {
      if (icon.parentNode?.nodeName === 'A') {
        const parentAnchor = icon.parentNode as HTMLAnchorElement;
        const url = parentAnchor.getAttribute('href');
        const name = parentAnchor.innerHTML.replaceAll('<i class="far fa-file"></i>', '').trim();
        parentAnchor.outerHTML = fileLink(url!, name);
      }
    });
  };

  const postImagePopup = () => {
    const imgs = document.querySelectorAll('#post-content img') as NodeListOf<HTMLImageElement>;
    imgs.forEach((currentImg) => {
      currentImg.style.maxWidth = '100%';
      currentImg.style.cursor = 'zoom-in';
      currentImg.addEventListener('click', () => {
        const safeSrc = currentImg.src.replace(/"/g, '&quot;');
        // token-exempt(10): window.open 으로 띄우는 **별도 document** 라 dl 토큰이 도달하지 않는다.
        // 이미지 뷰어 배경은 사진을 정확히 보기 위한 검정이 관례다.
        const imgPopupHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="user-scalable=yes, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, width=device-width" />
    <title>이미지 보기</title>
</head>
<body style="margin:0;background:#000;min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <img alt="확대 이미지" style="max-width:100%;max-height:100vh;height:auto;" onclick="window.close()" src="${safeSrc}" />
</body>
</html>`;
        const blob = new Blob([imgPopupHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      });
    });
  };

  const initVsCode = (doc: Document) => {
    Array.prototype.slice
      .call(doc.getElementsByTagName('div'), 0)
      .forEach((div: HTMLDivElement) => {
        // token-exempt: 색 지정이 아니라 CKEditor 가 만든 코드블록 배경을 **판별**하는 비교문이다
        if (div.style?.backgroundColor && div.style.backgroundColor === 'rgb(30, 30, 30)') {
          if (getRootElement(div)) {
            div.style.padding = '15px';
            div.style.scrollPadding = '15px';
            div.style.overflowX = 'scroll';
          }
        }
      });
  };

  const initIntellij = (doc: Document) => {
    Array.prototype.slice
      .call(doc.getElementsByTagName('div'), 0)
      .forEach((div: HTMLDivElement) => {
        // token-exempt: IntelliJ 테마 코드블록을 **판별**하는 비교문 — 색 지정이 아니다
        if (div.style?.backgroundColor && div.style.backgroundColor === 'rgb(40, 44, 52)') {
          if (getRootElement(div)) {
            div.style.padding = '15px';
            div.style.scrollPadding = '15px';
            div.style.overflowX = 'scroll';
          }
        }
      });
  };

  const initJetbrains = (doc: Document) => {
    Array.prototype.slice
      .call(doc.getElementsByTagName('div'), 0)
      .forEach((div: HTMLDivElement) => {
        // token-exempt: JetBrains 테마 코드블록을 **판별**하는 비교문 — 색 지정이 아니다
        if (div.style?.backgroundColor && div.style.backgroundColor === 'rgb(43, 43, 43)') {
          if (getRootElement(div)) {
            div.style.padding = '15px';
            div.style.scrollPadding = '15px';
            div.style.overflowX = 'scroll';
          }
        }
      });
  };

  const initLinkNewTab = (doc: Document) => {
    Array.prototype.slice.call(doc.getElementsByTagName('a'), 0).forEach((a: HTMLAnchorElement) => {
      a.target = '_blank';
    });
  };

  const getRootElement = (element: HTMLElement): boolean => {
    let rtn = true;
    let current: HTMLElement | null = element;
    while (current?.parentNode) {
      const parent = current.parentNode as HTMLElement;
      // token-exempt: 위와 같은 판별 비교문 — 색을 지정하지 않는다
      if (parent.style?.backgroundColor && parent.style.backgroundColor === 'rgb(30, 30, 30)') {
        rtn = false;
        break;
      }
      current = parent;
    }
    return rtn;
  };

  const showDeleteConfirmDialog = async () => {
    const ok = await askConfirm({
      message: '현재 포스트를 삭제하시겠습니까?',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    await deletePost();
  };

  const showPublicConfirmDialog = async () => {
    const ok = await askConfirm({
      message: postPublic
        ? '현재 포스트를 비공개 상태로 변경하시겠습니까?'
        : '현재 포스트를 공개 상태로 변경하시겠습니까?',
      confirmLabel: '변경',
    });
    if (!ok) return;
    await setPublicStatus();
  };

  const deletePost = async () => {
    await service.post
      .deletePost({ postId: String(post?.id) })
      .then((res: { data: { id: number } }) => {
        if (res.data.id === post?.id) {
          showToast('삭제에 성공하였습니다.');
          router.push('/');
        }
      })
      .catch((error) => {
        showApiErrorToast('삭제에 실패하였습니다.', error);
      });
  };

  const onEditor = () => {
    router.push(`/admin/write/${post?.id}`);
  };

  const setPublicStatus = async () => {
    if (postPublic) {
      await service.post
        .setPublicPost({ postId: String(post?.id), publicStatus: false })
        .then((res: { status: number }) => {
          if (res.status >= 200 && res.status < 300) {
            setPostPublic(false);
            showToast('공개를 비공개로 변경하였습니다.');
          }
        })
        .catch((error) => {
          showApiErrorToast('공개를 비공개로 변경하지 못했습니다.', error);
        });
    } else {
      await service.post
        .setPublicPost({ postId: String(post?.id), publicStatus: true })
        .then((res: { status: number }) => {
          if (res.status >= 200 && res.status < 300) {
            setPostPublic(true);
            showToast('비공개를 공개로 변경하였습니다.');
          }
        })
        .catch((error) => {
          showApiErrorToast('비공개를 공개로 변경하지 못했습니다.', error);
        });
    }
  };

  const searchCategory = (): string => {
    if (!post?.category?.id) {
      return '/search';
    }
    const condition = {
      ...searchObjectInit,
      ...{
        categories: [{ id: post.category.id, name: post.category.name }],
      },
    };
    return `/search?q=${base64Encode(JSON.stringify(condition))}`;
  };

  const formatDate = (value: string | undefined): string => {
    // 서버 렌더링 시 로컬 타임존 불일치를 피하기 위해 클라이언트 마운트 후에만 포맷한다
    if (!value || !isClientMounted) {
      return '';
    }
    return formatUtcToLocal(value, 'yyyy-MM-dd HH:mm:ss');
  };

  const readingTime = (): string => {
    if (!post?.body) return '';
    const plainText = post.body.replace(/<[^>]*>/g, '');
    const charCount = plainText.length;
    const minutes = Math.ceil(charCount / 500);
    return minutes < 1 ? '1분 미만' : `약 ${minutes}분 소요`;
  };

  if (post?.id !== 0 && post?.id > 0) {
    return (
      <div className="public-container public-container--post pb-8 pt-6 sm:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_var(--post-aside-w)]">
          <article className="surface-panel-strong overflow-hidden rounded-(--radius-panel)">
            <div className="px-(--public-gutter) py-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                    Article
                  </p>
                  <h1 className="section-title mt-3 text-[clamp(1.75rem,1.2rem+2.2vw,3rem)] font-semibold leading-tight tracking-[-0.045em] text-dl-fg">
                    {post.subject}
                  </h1>
                  <div className="public-muted-text mt-5 flex flex-wrap items-center gap-3 text-sm">
                    <Link
                      href={searchCategory()}
                      className="rounded-full border border-dl-tonal-border bg-dl-tonal px-4 py-2 font-semibold text-dl-tonal-fg transition hover:bg-dl-tonal-hover"
                    >
                      {post.category?.name}
                    </Link>
                    <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                      <CalendarDays className="h-4 w-4" />
                      created {formatDate(post.created.at)}
                    </span>
                    <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                      <Clock3 className="h-4 w-4" />
                      updated {formatDate(post.updated.at)}
                    </span>
                    <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                      <BookOpen className="h-4 w-4" />
                      {readingTime()}
                    </span>
                  </div>
                </div>

                {!(userState.isAuthenticated && userState.user.username) ? null : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline-gray"
                      size="sm"
                      className="public-control-surface rounded-full border"
                      aria-label="공개 상태 변경"
                      onClick={showPublicConfirmDialog}
                    >
                      {postPublic ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <GlobeLock className="h-4 w-4" />
                      )}
                      {postPublic ? 'Public' : 'Private'}
                    </Button>
                    <Button
                      variant="outline-gray"
                      size="sm"
                      className="public-control-surface rounded-full border"
                      aria-label="edit"
                      onClick={onEditor}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline-gray"
                      size="sm"
                      className="public-control-surface rounded-full border text-dl-danger hover:text-dl-danger-hover"
                      aria-label="delete"
                      onClick={showDeleteConfirmDialog}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 모바일 목차 — lg 미만에서 본문 위에 접기 형태로 노출 (데스크톱은 aside 가 담당) */}
            <div className="px-(--public-gutter) lg:hidden">
              <TableOfContents postBody={postBody} variant="collapse" />
            </div>

            {series && (
              <div className="px-(--public-gutter) py-5">
                <div className="rounded-2xl border border-dl-tonal-border bg-dl-tonal p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setSeriesExpanded(!seriesExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-dl-tonal-fg" />
                      <span className="text-sm font-semibold text-dl-tonal-fg">{series.title}</span>
                      <span className="rounded-full bg-dl-tonal-hover px-2 py-0.5 text-xs font-medium text-dl-tonal-fg">
                        {series.posts?.length ?? 0}편
                      </span>
                    </div>
                    {seriesExpanded ? (
                      <ChevronUp className="h-4 w-4 text-dl-tonal-fg" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-dl-tonal-fg" />
                    )}
                  </button>
                  {seriesExpanded && (
                    <ol className="mt-3 space-y-1 border-t border-dl-tonal-border pt-3">
                      {series.posts?.map((sp) => (
                        <li key={sp.postId}>
                          {sp.postId === post.id ? (
                            <span className="flex items-center gap-2 rounded-lg bg-dl-tonal-hover px-3 py-2 text-sm font-semibold text-dl-tonal-fg">
                              <span className="text-xs text-dl-primary">{sp.seq}.</span>
                              {sp.subject}
                            </span>
                          ) : (
                            <Link
                              href={`/post/${sp.postId}`}
                              className="public-muted-text flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-dl-tonal"
                            >
                              <span className="public-label-text text-xs">{sp.seq}.</span>
                              {sp.subject}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}

            {(tags?.length > 0 || (userState.isAuthenticated && userState.user.username)) && (
              <div className="px-(--public-gutter) py-6">
                <TagGroupComponent
                  postId={post?.id?.toString() ?? null}
                  tagList={tags}
                  clickable={true}
                />
              </div>
            )}

            <div className="border-t border-[color:var(--line-soft)] px-(--public-gutter) py-8">
              {postContent}
            </div>

            <div className="border-t border-[color:var(--line-soft)] px-(--public-gutter) py-6">
              <div className="grid gap-4 md:grid-cols-2">
                {prevPostId === 0 ? (
                  <div className="public-muted-panel public-muted-text rounded-[1.5rem] border border-dashed px-5 py-6 text-sm">
                    이전 글이 없습니다.
                  </div>
                ) : (
                  <Link
                    href={`/post/${prevPostId}`}
                    className="public-card-surface group rounded-[1.5rem] border px-5 py-6 transition"
                  >
                    <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                      Previous
                    </p>
                    <div className="public-muted-text mt-3 flex items-center gap-2 text-sm font-semibold transition group-hover:text-dl-primary-ink">
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      <span className="truncate">{prevNext?.prevSubject || '이전 글로 이동'}</span>
                    </div>
                  </Link>
                )}
                {nextPostId === 0 ? (
                  <div className="public-muted-panel public-muted-text rounded-[1.5rem] border border-dashed px-5 py-6 text-right text-sm">
                    다음 글이 없습니다.
                  </div>
                ) : (
                  <Link
                    href={`/post/${nextPostId}`}
                    className="public-card-surface group rounded-[1.5rem] border px-5 py-6 text-right transition"
                  >
                    <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                      Next
                    </p>
                    <div className="public-muted-text mt-3 flex items-center justify-end gap-2 text-sm font-semibold transition group-hover:text-dl-primary-ink">
                      <span className="truncate">{prevNext?.nextSubject || '다음 글로 이동'}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <div className="px-(--public-gutter) pb-8 pt-2">
                <p className="public-label-text mb-4 text-xs font-semibold uppercase tracking-[0.18em]">
                  Related Posts
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/post/${related.id}`}
                      className="public-card-surface group rounded-2xl border p-4 transition hover:shadow-sm"
                    >
                      <p className="truncate text-sm font-semibold text-dl-fg transition group-hover:text-dl-primary-ink">
                        {related.subject}
                      </p>
                      <div className="public-label-text mt-2 flex items-center gap-2 text-xs">
                        <span className="public-chip-surface inline-flex rounded-full border px-2 py-0.5">
                          {related.categoryName}
                        </span>
                        {isClientMounted && related.createDate && (
                          <span>{formatLocalDate(related.createDate)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* 세로가 짧은 화면에서 목차가 길면 카드 안의 리스트만 스크롤한다 — aside 자체를
              스크롤 컨테이너로 만들면 카드가 뷰포트 경계에서 잘리고 backdrop blur 도 깨진다 */}
          <aside className="hidden lg:sticky lg:top-(--sticky-top) lg:flex lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:flex-col lg:gap-5 lg:self-start">
            <div className="surface-panel-strong rounded-(--radius-panel) p-6 lg:flex lg:min-h-0 lg:flex-col">
              <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                Reading Context
              </p>
              <TableOfContents postBody={postBody} variant="sidebar" />
            </div>
            <div className="surface-panel-strong rounded-(--radius-panel) p-6 lg:shrink-0">
              <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                Metadata
              </p>
              <dl className="public-muted-text mt-4 space-y-4 text-sm">
                <div>
                  <dt className="public-label-text font-semibold">Category</dt>
                  <dd className="mt-1 text-dl-fg">{post.category?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="public-label-text font-semibold">Tags</dt>
                  <dd className="mt-1 text-dl-fg">{tags?.length || 0}</dd>
                </div>
                <div>
                  <dt className="public-label-text font-semibold">Visibility</dt>
                  <dd className="mt-1 text-dl-fg">{postPublic ? 'Public' : 'Private'}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <article className="public-container public-container--post pb-16 pt-6 sm:pt-10">
      <div className="surface-panel-strong rounded-(--radius-panel) px-(--public-gutter) py-12 text-center">
        <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
          Missing Article
        </p>
        <h2 className="section-title mt-3 text-4xl font-semibold text-dl-fg">No post found</h2>
      </div>
    </article>
  );
}
