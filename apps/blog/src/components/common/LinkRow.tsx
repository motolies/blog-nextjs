import { ArrowUpRight } from 'lucide-react';
import { resolveLinkIcon } from '@/lib/linkIcons';
import type { LinkItem } from '@/types/linkTree';

/**
 * 홈의 링크 행 한 줄 — 공개 즐겨찾기(FAVORITE)와 관리자 전용 플랫폼(PLATFORM)이 공유한다.
 *
 * 두 화면이 같은 마크업을 각자 들고 있다가 한쪽만 고쳐지는 사고를 막으려고 뽑아냈다.
 * types/linkTree.ts 가 "타입도 UI 도 하나로 공유한다"고 선언해 둔 것의 UI 쪽 이행이다.
 * 플랫폼 섹션은 관리자에게만 보이므로, 갈라져도 비로그인 QA 로는 절대 잡히지 않는다.
 *
 * 'use client' 를 넣지 않는다 — 훅도 핸들러도 없는 순수 렌더라 서버 컴포넌트(홈)와
 * 클라이언트 컴포넌트(플랫폼 섹션) 양쪽에서 그대로 쓰인다.
 *
 * 크기는 전부 공개 페이지 밀도 축(--public-*)이 지배한다. 호출부에서 text-* 나 p-* 유틸로
 * 덮지 말 것 — .public-text-* 는 언레이어드라 Tailwind 유틸을 이기고, 얹은 쪽이 조용히 죽는다.
 *
 * lucide 아이콘을 @hvy/ui 의 Icon 대신 직접 그리는 이유: Icon 의 크기 토큰
 * (--spacing-dl-ic-sm)은 16px 리터럴이라 모바일에서 축소되지 않는다. 같은 행의
 * ArrowUpRight 도 원래부터 raw lucide 였다.
 */
export default function LinkRow({ link }: { link: LinkItem }) {
  // 아이콘은 선택 항목이다 — 기존 데이터에는 하나도 없어서 값이 있을 때만 그린다.
  // 없을 때 폴백을 그리면 모든 링크가 같은 아이콘으로 도배된다.
  const LinkIcon = resolveLinkIcon(link.icon);

  return (
    <li>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="public-card-surface public-text-body group flex items-center gap-1.5 rounded-2xl border px-(--public-pad-card) py-(--public-row-pad-y) font-medium text-dl-fg transition hover:text-dl-primary-ink lg:gap-2"
      >
        {LinkIcon && <LinkIcon className="size-(--public-icon) shrink-0" aria-hidden="true" />}
        {/* 잘리면 이름을 되찾을 길이 없어 title 로 전문을 남긴다(데스크톱 hover 한정). */}
        <span className="flex-1 truncate" title={link.name}>
          {link.name}
        </span>
        <ArrowUpRight
          className="size-(--public-icon) shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    </li>
  );
}
