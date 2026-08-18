'use client';

import { Badge, Button, Card, CardHeader } from '@hvy/ui';
import { Printer, Save, Trash2 } from 'lucide-react';

/**
 * Card · CardHeader — destructive(삭제)는 actions 와 분리해 왼쪽 끝에 둔다.
 * 주 실행 옆은 오클릭 자리다(v3 §ds-06).
 */
export function CardHeaderDemo() {
  return (
    <Card className="max-w-2xl">
      <CardHeader
        title="주문 요약"
        aside={<Badge tone="primary">데모</Badge>}
        destructive={
          <Button variant="outline-red" icon={Trash2}>
            삭제
          </Button>
        }
        actions={
          <>
            <Button icon={Printer}>출력</Button>
            <Button variant="primary" icon={Save}>
              저장
            </Button>
          </>
        }
      />
      <p className="text-dl-sm text-dl-fg-muted">
        카드 본문. 폼 카드(기본 variant)는 안쪽 여백을 카드가 갖고, 그리드 패널(variant=grid)은 표가
        카드 끝까지 닿도록 여백이 0 이다.
      </p>
    </Card>
  );
}
