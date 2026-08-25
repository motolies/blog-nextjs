'use client';

import { Badge, FieldValue, FormGrid } from '@hvy/ui';

/**
 * 읽기 전용 상세 — 같은 격자에 `FieldValue` 만 담는다.
 *
 * 읽기 전용 축은 **넷**이고 이건 그중 "영구 조회"다:
 *   · `lock` — "시스템이 채워 영구 불변"(칸 수준, 모든 mode 를 이긴다)
 *   · `masking` — "서버가 마스킹한 개인정보"(칸 수준, 전송 제외)
 *   · `FieldValue` — "애초에 고칠 대상이 아니다"(시간 개념 없음, 여기)
 *   · `mode` — "지금은 조회 중이고 모드를 바꾸면 편집"(폼 수준, FormMode/Field)
 * 조회↔수정을 오가는 화면이면 `FieldValue` 가 아니라 `<Field mode="view">` 를 쓴다 —
 * 상세 폼 조회↔수정(detail-modes) 예제가 그 대비다.
 * 값 칸의 최소 높이가 컨트롤(42px)과 같아, 한 격자에서 편집 칸과 섞여도 행이 맞는다.
 */
export function FormGridReadonlyDemo() {
  return (
    <div className="max-w-4xl">
      <FormGrid>
        <FieldValue label="게시글 ID">POST-100024</FieldValue>
        <FieldValue label="작성자">김민준</FieldValue>
        <FieldValue label="게시글 상태">
          <Badge tone="success">발행</Badge>
        </FieldValue>
        <FieldValue label="작성일">2026-07-15</FieldValue>
        <FieldValue label="카테고리">개발</FieldValue>
        <FieldValue label="조회수">24,500 회</FieldValue>
        <FieldValue label="요약" className="col-span-full">
          서울특별시 강남구 테헤란로 123, 4층
        </FieldValue>
      </FormGrid>
    </div>
  );
}
