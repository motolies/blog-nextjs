'use client';

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  showToast,
  useConfirm,
} from '@hvy/ui';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  EllipsisVertical,
  Globe,
  GlobeLock,
  List,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCodeHighlight } from '@/hooks/useCodeHighlight';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { buildSearchHref } from '@/lib/searchHref';
import { searchObjectInit } from '@/model/searchObject';
import service from '@/service';
import { useAuthStore } from '@/store/useAuthStore';
import type { Series } from '@/types/series';
import type { Tag } from '@/types/tag';
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

// 제목 아래 메타 줄의 칩 공통 형태 — 카테고리·공개상태·날짜·읽는 시간이 같은 pill 을 공유한다.
const META_CHIP =
  'public-chip-surface-strong inline-flex items-center gap-1.5 rounded-full border px-(--public-chip-pad-x) py-(--public-chip-pad-y) lg:gap-2';

export default function PostComponent({ post, prevNext }: PostComponentProps) {
  const router = useRouter();
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );
  // 관리 UI(공개 상태 칩·액션 메뉴) 노출 판정 — 같은 조건이 여러 곳에서 쓰인다.
  const isOwner = Boolean(userState.isAuthenticated && userState.user.username);

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
    return buildSearchHref(condition);
  };

  // 모바일은 초 단위를 떼고 분까지만 보여 칩 줄이 한 줄 덜 차지하게 한다(호출부에서 패턴 지정).
  const formatDate = (value: string | undefined, fmt = 'yyyy-MM-dd HH:mm:ss'): string => {
    // 서버 렌더링 시 로컬 타임존 불일치를 피하기 위해 클라이언트 마운트 후에만 포맷한다
    if (!value || !isClientMounted) {
      return '';
    }
    return formatUtcToLocal(value, fmt);
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
      <div className="public-container public-container--post pb-8 pt-4 lg:pt-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_var(--post-aside-w)] lg:gap-8">
          <article className="surface-panel-strong public-panel--bleed overflow-hidden rounded-(--radius-panel)">
            <div className="px-(--public-gutter) py-(--public-pad-panel)">
              <div className="flex items-start justify-between gap-4 lg:gap-6">
                {/* flex-1 min-w-0 이 없으면 제목 블록이 콘텐츠 폭만큼 부풀어 액션 메뉴를
                    다음 줄로 밀어낸다(버튼 3개를 아이콘 하나로 줄이며 드러난 문제).
                    min-w-0 은 flex 아이템의 자동 최소 크기(min-content)를 풀어 긴 제목이
                    트랙을 밀지 않게 하는 짝 선언이다. */}
                <div className="min-w-0 flex-1">
                  <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
                    Article
                  </p>
                  <h1 className="section-title public-text-hero mt-3 font-semibold tracking-[-0.045em] text-dl-fg">
                    {post.subject}
                  </h1>
                  {/* 메타 줄은 public-text-meta(11→12px) — public-* 는 언레이어드라 반응형 text-*
                      유틸로는 못 줄인다. 크기 변경은 토큰 교체나 클래스 교체로만 한다. */}
                  <div className="public-muted-text public-text-meta mt-4 flex flex-wrap items-center gap-2 lg:mt-5 lg:gap-3">
                    <Link
                      href={searchCategory()}
                      className="rounded-full border border-dl-tonal-border bg-dl-tonal px-(--public-chip-pad-x) py-(--public-chip-pad-y) font-semibold text-dl-tonal-fg transition hover:bg-dl-tonal-hover"
                    >
                      {post.category?.name}
                    </Link>
                    {/* 액션 메뉴로 접힌 공개 상태 표식 — 기본(공개)은 중립, 비공개일 때만 강조한다.
                        비로그인 방문자에게는 의미가 없어 소유자에게만 보인다. */}
                    {isOwner && (
                      <span
                        className={cn(
                          META_CHIP,
                          // text-dl-danger 유틸은 언레이어드 .public-chip-surface-strong 의
                          // color 선언에 막혀 죽는다 — global.css 의 수정자 클래스를 써야 한다.
                          !postPublic && 'public-chip--danger font-semibold',
                        )}
                      >
                        {postPublic ? (
                          <Globe className="size-(--public-icon)" />
                        ) : (
                          <GlobeLock className="size-(--public-icon)" />
                        )}
                        {postPublic ? '공개' : '비공개'}
                      </span>
                    )}
                    {/* 모바일은 초와 영문 라벨을 떼 칩 줄을 한 줄 줄인다. 라벨은 지우는 게 아니라
                        sr-only 로 남겨 스크린리더가 맥락을 잃지 않게 한다 — 순수 span 은 generic
                        role 이라 aria-label 이 무시되므로(biome useAriaPropsSupportedByRole)
                        텍스트 노드로 두는 이 방식이 유일하게 유효하다.
                        sr-only 는 position:absolute 라 flex 아이템에서 빠져 gap 도 어긋나지 않는다. */}
                    <span className={META_CHIP}>
                      <CalendarDays className="size-(--public-icon)" />
                      <span className="sr-only lg:not-sr-only">created</span>
                      <span className="lg:hidden">
                        {formatDate(post.created.at, 'yyyy-MM-dd HH:mm')}
                      </span>
                      <span className="hidden lg:inline">{formatDate(post.created.at)}</span>
                    </span>
                    <span className={META_CHIP}>
                      <Clock3 className="size-(--public-icon)" />
                      <span className="sr-only lg:not-sr-only">updated</span>
                      <span className="lg:hidden">
                        {formatDate(post.updated.at, 'yyyy-MM-dd HH:mm')}
                      </span>
                      <span className="hidden lg:inline">{formatDate(post.updated.at)}</span>
                    </span>
                    <span className={META_CHIP}>
                      <BookOpen className="size-(--public-icon)" />
                      {readingTime()}
                    </span>
                  </div>
                </div>

                {/* 공개 상태는 위 메타 칩이 표시하고, 여기는 액션만 담는다.
                    DropdownMenuItem 은 onClick 이 아니라 onSelect 를 받는다. */}
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <IconButton
                        icon={EllipsisVertical}
                        label="포스트 액션"
                        size="sm"
                        className="public-control-surface rounded-full border"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        icon={postPublic ? GlobeLock : Globe}
                        onSelect={showPublicConfirmDialog}
                      >
                        {postPublic ? '비공개로 전환' : '공개로 전환'}
                      </DropdownMenuItem>
                      <DropdownMenuItem icon={Pencil} onSelect={onEditor}>
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        icon={Trash2}
                        destructive
                        onSelect={showDeleteConfirmDialog}
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* 모바일 목차 — lg 미만에서 본문 위에 접기 형태로 노출 (데스크톱은 aside 가 담당) */}
            <div className="px-(--public-gutter) lg:hidden">
              <TableOfContents postBody={postBody} variant="collapse" />
            </div>

            {series && (
              <div className="px-(--public-gutter) py-(--public-pad-card)">
                <div className="rounded-(--radius-card) border border-dl-tonal-border bg-dl-tonal p-(--public-pad-card)">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setSeriesExpanded(!seriesExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <List className="size-(--public-icon) text-dl-tonal-fg" />
                      <span className="public-text-body font-semibold text-dl-tonal-fg">
                        {series.title}
                      </span>
                      <span className="public-text-meta rounded-full bg-dl-tonal-hover px-2 py-0.5 font-medium text-dl-tonal-fg">
                        {series.posts?.length ?? 0}편
                      </span>
                    </div>
                    {seriesExpanded ? (
                      <ChevronUp className="size-(--public-icon) text-dl-tonal-fg" />
                    ) : (
                      <ChevronDown className="size-(--public-icon) text-dl-tonal-fg" />
                    )}
                  </button>
                  {seriesExpanded && (
                    <ol className="mt-3 space-y-1 border-t border-dl-tonal-border pt-3">
                      {series.posts?.map((sp) => (
                        <li key={sp.postId}>
                          {sp.postId === post.id ? (
                            <span className="public-text-body flex items-center gap-2 rounded-lg bg-dl-tonal-hover px-3 py-1.5 font-semibold text-dl-tonal-fg lg:py-2">
                              <span className="public-text-meta text-dl-primary">{sp.seq}.</span>
                              {sp.subject}
                            </span>
                          ) : (
                            <Link
                              href={`/post/${sp.postId}`}
                              className="public-muted-text public-text-body flex items-center gap-2 rounded-lg px-3 py-1.5 transition hover:bg-dl-tonal lg:py-2"
                            >
                              <span className="public-label-text public-text-meta">{sp.seq}.</span>
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

            {(tags?.length > 0 || isOwner) && (
              <div className="px-(--public-gutter) py-(--public-pad-panel)">
                <TagGroupComponent
                  postId={post?.id?.toString() ?? null}
                  tagList={tags}
                  clickable={true}
                />
              </div>
            )}

            <div className="border-t border-[color:var(--line-soft)] px-(--public-gutter) py-(--public-pad-panel)">
              {postContent}
            </div>

            <div className="border-t border-[color:var(--line-soft)] px-(--public-gutter) py-(--public-pad-panel)">
              {/* 단일 컬럼 구간의 트랙 하한을 0 으로 — grid 아이템의 min-width:auto 는 자동 최소 크기가
                  min-content 라, 안쪽 truncate 의 nowrap 텍스트 폭이 그대로 트랙을 밀어 카드가 넘친다.
                  md 이상은 grid-cols-2 가 이미 minmax(0,1fr) 이라 이 선언을 덮어쓴다. */}
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 lg:gap-4">
                {prevPostId === 0 ? (
                  <div className="public-muted-panel public-muted-text public-text-body rounded-(--radius-card) border border-dashed p-(--public-pad-panel)">
                    이전 글이 없습니다.
                  </div>
                ) : (
                  <Link
                    href={`/post/${prevPostId}`}
                    className="public-card-surface group rounded-(--radius-card) border p-(--public-pad-panel) transition"
                  >
                    <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
                      Previous
                    </p>
                    <div className="public-muted-text public-text-body mt-3 flex items-center gap-2 font-semibold transition group-hover:text-dl-primary-ink">
                      <ArrowLeft className="size-(--public-icon) shrink-0" />
                      <span className="truncate">{prevNext?.prevSubject || '이전 글로 이동'}</span>
                    </div>
                  </Link>
                )}
                {nextPostId === 0 ? (
                  <div className="public-muted-panel public-muted-text public-text-body rounded-(--radius-card) border border-dashed p-(--public-pad-panel) text-right">
                    다음 글이 없습니다.
                  </div>
                ) : (
                  <Link
                    href={`/post/${nextPostId}`}
                    className="public-card-surface group rounded-(--radius-card) border p-(--public-pad-panel) text-right transition"
                  >
                    <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
                      Next
                    </p>
                    <div className="public-muted-text public-text-body mt-3 flex items-center justify-end gap-2 font-semibold transition group-hover:text-dl-primary-ink">
                      <span className="truncate">{prevNext?.nextSubject || '다음 글로 이동'}</span>
                      <ArrowRight className="size-(--public-icon) shrink-0" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <div className="px-(--public-gutter) pb-8 pt-2">
                <p className="public-label-text public-text-meta mb-3 font-semibold uppercase tracking-[0.18em] lg:mb-4">
                  Related Posts
                </p>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/post/${related.id}`}
                      className="public-card-surface group rounded-(--radius-card) border p-(--public-pad-card) transition hover:shadow-sm"
                    >
                      <p className="public-text-body truncate font-semibold text-dl-fg transition group-hover:text-dl-primary-ink">
                        {related.subject}
                      </p>
                      <div className="public-label-text public-text-meta mt-2 flex items-center gap-2">
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
              <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
                Reading Context
              </p>
              <TableOfContents postBody={postBody} variant="sidebar" />
            </div>
            <div className="surface-panel-strong rounded-(--radius-panel) p-6 lg:shrink-0">
              <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
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
        <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
          Missing Article
        </p>
        <h2 className="section-title mt-3 text-4xl font-semibold text-dl-fg">No post found</h2>
      </div>
    </article>
  );
}
