'use client';

import { Field, Icon, Input, Tooltip } from '@hvy/ui';
import { CircleHelp } from 'lucide-react';

/**
 * QA label-group 재현 — 레이블 옆 question 아이콘이 툴팁 트리거다.
 * 트리거는 버튼이라 키보드 포커스로도 열린다(Esc 로 닫힘).
 */
export function LabelTooltipDemo() {
  return (
    <Field
      label={
        <span className="inline-flex items-center gap-0.5">
          검색 기준
          <Tooltip content={'검색 가능 기준값\n· 배송 ID\n· 전표번호\n· 출고송장번호'}>
            <button type="button" className="flex text-dl-fg-muted" aria-label="도움말">
              <Icon icon={CircleHelp} size="sm" />
            </button>
          </Tooltip>
        </span>
      }
      htmlFor="tt-input"
      className="w-64"
    >
      <Input id="tt-input" placeholder="플레이스홀더 텍스트" />
    </Field>
  );
}
