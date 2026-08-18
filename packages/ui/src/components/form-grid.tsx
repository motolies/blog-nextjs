import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * 상세 폼 격자 — 라벨이 컨트롤 **위**에 오는 세로 쌍을 자동 줄바꿈 열에 배치한다.
 *
 * **`<table>` 이 아니다.** 한때 이 자리에 `FormTable`(`<table>` + `<th>` 회색 라벨 칸)이
 * 있었고 근거는 "라벨·값 쌍이 `rowSpan`/`colSpan` 으로 병합된다"였는데, 실제로는
 * `rowSpan` 사용처가 하나도 없었고 `colSpan` 은 메모 칸 하나뿐이었다.
 * 그 하나는 grid 에서 `col-span-full`(= `1 / -1`) 이고, 열이 몇 개로 접히든 뜻이
 * 유지된다 — `colSpan={4}` 처럼 열 개수에 묶인 숫자가 아니다.
 *
 * 회색 라벨 칸을 함께 버린 이유는 미감이 아니라 **뜻**이다. 그 배경은 그리드 헤더와
 * 같은 값이라 "이건 표의 머리다"라고 말하는데, 상세 폼은 표가 아니다.
 * 라벨은 면(面) 없이 굵기로만 구분한다(`Field` 의 `Label`, 14px/600).
 *
 * 항목은 `Field`(입력) 또는 `FieldValue`(읽기 전용)를 그대로 넣는다 —
 * 둘 다 `flex flex-col` 래퍼라 그 자체가 온전한 grid item 이다.
 * 열 수를 강제해야 하면 `className` 으로 `grid-cols-*` 를 덮는다.
 */
export function FormGrid({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={cn('dl-form-grid', className)}>{children}</div>;
}
