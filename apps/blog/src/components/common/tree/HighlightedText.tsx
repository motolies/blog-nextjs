import { Fragment } from 'react';
import { splitByMatch } from '@/lib/treeSearch';

interface HighlightedTextProps {
  text: string;
  /** 비어 있으면 원문을 그대로 그린다. */
  query: string;
}

/**
 * 검색어와 일치하는 **글자만** 강조해 그린다. 행 전체를 칠하지 않는 이유는 필터링이 이미
 * "이 행은 결과다" 를 말하고 있어서다 — 배경까지 칠하면 화면이 온통 노랗다.
 *
 * `<mark>` 의 배색 클래스는 **지우면 안 된다.** 브라우저 기본 스타일이 시스템 색
 * (`background: Mark`)을 넣어 테마 토큰 밖의 노랑이 새고 다크에서 대비가 깨진다.
 * Tailwind preflight 는 mark 를 리셋하지 않으므로 클래스로 덮는 것이 유일한 방어다.
 */
export default function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = splitByMatch(text, query);
  // 조상 경로 노드는 매칭이 없다 — 그때는 원문을 그대로 돌려 DOM 을 늘리지 않는다.
  if (segments.length === 1 && !segments[0].matched) return <>{text}</>;

  // key 는 구간의 시작 오프셋으로 만든다 — 배열 인덱스는 lint 가 막고, 텍스트만으로는 중복된다.
  let offset = 0;

  return (
    <>
      {segments.map((segment) => {
        const key = offset;
        offset += segment.text.length;

        return segment.matched ? (
          <mark key={key} className="rounded-[2px] bg-dl-warning-bg px-0.5 text-dl-warning-ink">
            {segment.text}
          </mark>
        ) : (
          <Fragment key={key}>{segment.text}</Fragment>
        );
      })}
    </>
  );
}
