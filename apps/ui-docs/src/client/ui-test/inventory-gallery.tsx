'use client';

import * as HvyUI from '@hvy/ui';
import { Badge } from '@hvy/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { normalizeTheme, withTheme } from '../../shared/theme';
import { EXPORT_INFO } from './inventory-info';
import { Panel } from './playground';

/**
 * 개요 — barrel(`packages/ui/src/index.ts`)의 **런타임 export 를 자동 나열**한다.
 *
 * 수동 목록이 아니라 `Object.keys(namespace)` 인 이유: barrel 에 export 가 추가되면
 * 이 목록에 자동으로 나타나고, `EXPORT_INFO`(inventory-info.ts) 맵에 없으면 "데모 없음"
 * 배지로 표시된다 — 데모 누락이 스스로 드러나는 부패 방지 장치다. 타입 export 는
 * 런타임 값이 아니라 잡히지 않는다. href 가 실제 문서를 가리키는지는 registry.test.ts 가 검사한다.
 */

export function InventoryGallery() {
  const theme = normalizeTheme(useSearchParams().get('theme'));
  const names = Object.keys(HvyUI).sort((a, b) => a.localeCompare(b, 'en'));
  const missingCount = names.filter((name) => !EXPORT_INFO[name]).length;

  return (
    <Panel
      title={`런타임 export ${names.length}개`}
      note={
        missingCount > 0 ? (
          <>
            barrel 에 새 export 가 추가되었습니다 — <b>데모 없음 {missingCount}개</b>. 데모를 붙이고
            EXPORT_INFO 맵을 갱신하세요.
          </>
        ) : (
          '모든 export 에 데모 위치 또는 설명이 연결되어 있다.'
        )
      }
      className="p-0"
    >
      <ul>
        {names.map((name) => {
          const info = EXPORT_INFO[name];
          return (
            <li
              key={name}
              className="flex items-center gap-3 border-b border-dl-divider px-4 py-2 last:border-b-0"
            >
              <code className="w-52 shrink-0 truncate font-dl-mono text-dl-sm text-dl-fg">
                {name}
              </code>
              {info?.href ? (
                <Link
                  href={withTheme(info.href, theme)}
                  className="shrink-0 rounded-dl-badge bg-dl-tonal px-2 py-0.5 text-dl-xs font-semibold text-dl-tonal-fg hover:bg-dl-tonal-hover"
                >
                  데모 보기
                </Link>
              ) : null}
              {info?.note ? (
                <span className="min-w-0 truncate text-dl-sm text-dl-fg-muted">{info.note}</span>
              ) : null}
              {info ? null : <Badge tone="danger">데모 없음</Badge>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
