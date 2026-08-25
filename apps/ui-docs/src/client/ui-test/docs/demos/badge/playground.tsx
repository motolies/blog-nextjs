'use client';

import { Badge, CONTROL_SIZES, type ControlSize } from '@hvy/ui';
import { useState } from 'react';
import { jsxTag } from '../../../code-snippet';
import { DEMO_STATUS_META, DEMO_STATUSES } from '../../../mock-posts';
import {
  ControlGroup,
  EnumControl,
  MultiEnumControl,
  PlaygroundGrid,
  TextControl,
} from '../../../playground';

/**
 * Badge 플레이그라운드 — 5톤 + 게시글 상태 매핑 예시.
 * 색은 진행 국면으로 나눈다: 시작/진행(틸) · 전환·보류(주황) · 완료(초록) · 종료(회색) · 비정상(빨강).
 *
 * 「함께 보기」가 MultiEnumControl 인 이유: 톤은 **진행 국면 구분**이라 하나씩 보면
 * "무슨 색인가"만 알고 "어느 국면인가"는 모른다. 옆에 놓아야 그 차이가 읽힌다.
 */
const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'] as const;

export function BadgePlaygroundDemo() {
  const [tone, setTone] = useState<(typeof TONES)[number]>('primary');
  const [size, setSize] = useState<ControlSize>('md');
  const [text, setText] = useState('발행');
  const [compare, setCompare] = useState<readonly (typeof TONES)[number][]>([]);

  const code = jsxTag('Badge', { tone, size: size === 'md' ? undefined : size }, text);

  return (
    <PlaygroundGrid
      controls={
        <>
          <ControlGroup title="모양">
            <EnumControl label="tone" value={tone} options={TONES} onChange={setTone} />
            <EnumControl label="size" value={size} options={CONTROL_SIZES} onChange={setSize} />
            <TextControl label="문구" value={text} onChange={setText} placeholder="긴 문구도" />
          </ControlGroup>
          <ControlGroup title="비교" note="켠 톤을 나란히 놓아 국면 차이를 본다">
            <MultiEnumControl
              label="함께 보기"
              values={compare}
              options={TONES}
              onChange={setCompare}
            />
          </ControlGroup>
        </>
      }
      code={code}
    >
      <Badge tone={tone} size={size}>
        {text}
      </Badge>
      {compare.length > 0 ? (
        <>
          <span className="mx-1 h-5 w-px bg-dl-separator" />
          {compare.map((entry) => (
            <Badge key={entry} tone={entry} size={size}>
              {text || entry}
            </Badge>
          ))}
        </>
      ) : null}
      <span className="mx-2 h-5 w-px bg-dl-separator" />
      {/* 목데이터의 상태 5종 — tone 유니온과 1:1 이라는 사실을 화면으로 못박는 자리다. */}
      {DEMO_STATUSES.map((status) => (
        <Badge key={status} tone={DEMO_STATUS_META[status].tone} size={size}>
          {DEMO_STATUS_META[status].label}
        </Badge>
      ))}
    </PlaygroundGrid>
  );
}
