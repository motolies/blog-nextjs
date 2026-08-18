'use client';

import { ChevronDown } from 'lucide-react';
import { Collapsible as RadixCollapsible } from 'radix-ui';
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { Card, CardHeader } from './card';
import { FormGrid } from './form-grid';

/**
 * 상세 폼 섹션 — `Card(form)` + `CardHeader` + `FormGrid` 3중주의 래퍼.
 *
 * 상세·등록 화면이 이 3중주를 섹션마다 복제하던 것을 흡수한다 — 구성물 셋이 전부
 * `ui` 소유이고 도메인·데이터 배선을 모르므로 레이아웃 프리미티브다(FormGrid 와
 * 같은 급). children 은 `Field`/`FieldValue` — FormGrid 에 그대로 담긴다.
 * 격자가 아닌 내용(서브 그리드 등)은 이 래퍼가 아니라 `Card` 를 직접 쓴다.
 *
 * `collapsible` 이면 제목이 접기 토글이 된다(radix Collapsible — aria-expanded·
 * 키보드는 radix 몫). 접힘 상태는 세션 휘발이다 — 영속이 필요해지면 그때 연다.
 * `FormMode` 는 소비하지 않고 통과시킨다 — 섹션은 폼 상태의 주체가 아니다.
 */
export function FormSection({
  title,
  aside,
  destructive,
  actions,
  collapsible,
  defaultOpen = true,
  className,
  children,
}: {
  readonly title: ReactNode;
  /** 제목 옆 보조 표시 — CardHeader 의 aside 그대로. */
  readonly aside?: ReactNode;
  /** 파괴적 액션 — 주 실행(오른쪽 끝)과 분리된 왼쪽 자리(CardHeader 규칙). */
  readonly destructive?: ReactNode;
  readonly actions?: ReactNode;
  /** 제목을 접기 토글로 만든다 — 긴 상세 화면에서 안 쓰는 섹션을 접는 용도. */
  readonly collapsible?: boolean;
  readonly defaultOpen?: boolean;
  readonly className?: string;
  /** `Field`/`FieldValue` 항목들 — FormGrid 에 그대로 담긴다. */
  readonly children: ReactNode;
}) {
  if (!collapsible) {
    return (
      <Card className={className}>
        <CardHeader title={title} aside={aside} destructive={destructive} actions={actions} />
        <FormGrid>{children}</FormGrid>
      </Card>
    );
  }

  return (
    // named group — Trigger 자신의 `group`(화살표 회전용)과 조상 판정이 섞이지 않게 가른다.
    <RadixCollapsible.Root defaultOpen={defaultOpen} className="group/section">
      <Card className={className}>
        <CardHeader
          title={
            <RadixCollapsible.Trigger
              type="button"
              className="group flex items-center gap-1.5 text-inherit"
            >
              {title}
              <span
                aria-hidden
                className={cn(
                  'flex text-dl-fg-muted transition-transform',
                  'group-data-[state=closed]:-rotate-90',
                )}
              >
                <Icon icon={ChevronDown} size="sm" />
              </span>
            </RadixCollapsible.Trigger>
          }
          aside={aside}
          destructive={destructive}
          actions={actions}
          // 접힌 섹션은 제목 줄만 남는다 — 머리 아래 여백(mb-3)이 빈 공간으로 남지 않게 지운다.
          className="group-data-[state=closed]/section:mb-0"
        />
        <RadixCollapsible.Content>
          <FormGrid>{children}</FormGrid>
        </RadixCollapsible.Content>
      </Card>
    </RadixCollapsible.Root>
  );
}
