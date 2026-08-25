'use client';

import { Badge, Button, clampToGroup, findDropIndex, moveItem, shiftFor } from '@hvy/ui';
import { useState } from 'react';

/**
 * 순수 함수 4종 — **DOM 없이 계산만 본다.**
 *
 * 이 레포의 vitest 환경이 node(DOM 없음)라 이 함수들에만 단위 테스트가 붙는다.
 * 재배열은 **틀려도 에러가 안 나고 항목만 엉뚱한 곳에 놓이는** 종류라 그 방어가 필요하다.
 *
 * 검증 포인트:
 * · moveItem 은 원본을 건드리지 않고 `from === to` 면 **같은 참조**를 돌려준다
 * · clampToGroup 은 목표를 자기 그룹의 `[시작, 끝]` 안으로 자른다
 * · findDropIndex 는 항목 높이가 균일하지 않아도 **실제 중심 좌표**로 판정한다 —
 *   줄바꿈된 행이 섞여도 동작한다
 * · shiftFor 는 잡은 항목(index === from)에 0 을 주고 **지나온 구간만** 한 칸 당기거나 민다 —
 *   그래서 떠난 자리가 목표 지점으로 따라 이동하며 빈칸이 된다
 *
 * ⚠️ 아래 포인터 y 슬라이더는 네이티브 `<input type="range">` 다. 플레이그라운드 컨트롤에는
 * 슬라이더를 두지 않는데(`playground.tsx` 머리말의 기각 근거 참조), 여기는 **컨트롤이 아니라
 * 계측 장치**다 — 조작 대상이 컴포넌트의 prop 이 아니라 "포인터가 지금 어디 있는가" 라는
 * 연속 좌표이고, findDropIndex 의 경계는 그 좌표를 훑어야만 보인다. `@hvy/ui` 에 Slider 가
 * 생기면 이 자리가 첫 소비자다.
 */

const LIST = ['A', 'B', 'C', 'D', 'E'];
/** 앞 2개가 고정 그룹 — 컬럼 설정의 pinned 와 같은 표식이다. */
const GROUPS = [true, true, false, false, false];
/** 높이가 **균일하지 않은** 목록의 중심 좌표 — findDropIndex 가 이걸 그대로 읽는다. */
const CENTERS = [20, 70, 150, 200, 250];

export function ListReorderPureFnsDemo() {
  const [from, setFrom] = useState(3);
  const [to, setTo] = useState(0);
  const [pointerY, setPointerY] = useState(160);

  const moved = moveItem(LIST, from, to);
  const sameRef = moved === LIST;
  const clamped = clampToGroup(GROUPS, from, to);
  const dropIndex = findDropIndex(CENTERS, pointerY);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-dl-xs">
          <span className="text-dl-fg-muted">from</span>
          {LIST.map((_, index) => (
            <Button
              key={`from-${LIST[index]}`}
              size="xs"
              variant={from === index ? 'primary' : 'outline-gray'}
              onClick={() => setFrom(index)}
            >
              {index}
            </Button>
          ))}
          <span className="ml-3 text-dl-fg-muted">to</span>
          {LIST.map((_, index) => (
            <Button
              key={`to-${LIST[index]}`}
              size="xs"
              variant={to === index ? 'primary' : 'outline-gray'}
              onClick={() => setTo(index)}
            >
              {index}
            </Button>
          ))}
        </div>

        <dl className="flex flex-col gap-1.5 text-dl-xs">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="w-44 shrink-0 font-dl-mono text-dl-fg-muted">
              moveItem(list, {from}, {to})
            </dt>
            <dd className="font-dl-mono text-dl-fg">
              [{moved.join(', ')}]{' '}
              {sameRef ? (
                <Badge tone="success" size="xs">
                  같은 참조
                </Badge>
              ) : (
                <Badge tone="neutral" size="xs">
                  새 배열
                </Badge>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="w-44 shrink-0 font-dl-mono text-dl-fg-muted">
              clampToGroup(groups, {from}, {to})
            </dt>
            <dd className="font-dl-mono text-dl-fg">
              {clamped}
              <span className="ml-2 text-dl-fg-muted">
                groups = [{GROUPS.map((g) => (g ? '📌' : '·')).join('')}] — {from} 번은{' '}
                {GROUPS[from] ? '고정' : '일반'} 구간이라 거기까지만 간다
              </span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="w-44 shrink-0 font-dl-mono text-dl-fg-muted">shiftFor(각 index)</dt>
            <dd className="font-dl-mono text-dl-fg">
              [{LIST.map((_, index) => shiftFor(index, from, to, 50)).join(', ')}]
              <span className="ml-2 text-dl-fg-muted">rowHeight=50 · 잡은 항목은 0</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-2 rounded-dl-control bg-dl-canvas p-3">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">
          findDropIndex — 높이가 균일하지 않아도 실제 좌표로 판정
        </h4>
        <label className="flex items-center gap-2 text-dl-xs text-dl-fg">
          포인터 y
          <input
            type="range"
            min={0}
            max={280}
            value={pointerY}
            onChange={(event) => setPointerY(Number(event.target.value))}
            className="w-56"
            aria-label="포인터 y 좌표"
          />
          <span className="w-10 font-dl-mono">{pointerY}</span>
        </label>
        <p className="font-dl-mono text-dl-xs text-dl-fg">
          centers = [{CENTERS.join(', ')}] → 결과 {dropIndex} ({LIST[dropIndex]})
        </p>
        <p className="text-dl-xs text-dl-fg-muted">
          간격이 50·80·50·50 으로 들쭉날쭉하다 — 균일하다고 가정했다면 결과가 어긋난다.
        </p>
      </section>
    </div>
  );
}
