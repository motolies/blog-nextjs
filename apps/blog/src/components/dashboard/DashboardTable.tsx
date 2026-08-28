import { Table, type TableProps } from '@hvy/ui';

/**
 * 대시보드 위젯 안의 정적 표 — @hvy/ui Table 을 가로 넘침 안전망(.admin-table-scroll)으로 감싼다.
 *
 * 왜 DashboardWidget 이 아니라 여기인가: 위젯 body 8종 중 표는 4종뿐이고,
 * BarList·Sparkline body 에 overflow-x:auto 를 걸면 CSS 규칙상 overflow-y 까지
 * visible→auto 로 승격되어 차트에 필요 없는 스크롤 컨테이너가 생긴다.
 * DashboardWidget 은 껍데기와 상태 머신만 소유한다(그 파일 헤더 주석 참조).
 *
 * scrollX 같은 prop 을 위젯에 두지 않는 이유도 같다 — 그 값은 "children 이 표인가"에서
 * 전부 파생되므로 자식의 타입을 부모 prop 으로 복제하는 계약 누수가 된다.
 * "감싸는 것을 잊지 않는다"는 목표는 prop 이 아니라 import 로 달성한다.
 *
 * 밀도 기본값이 sm 인 것은 위젯 카드가 좁아서다 — 호출부 4곳이 모두 sm 을 쓰고 있었다.
 */
export function DashboardTable({ size = 'sm', ...props }: TableProps) {
  return (
    <div className="admin-table-scroll">
      <Table size={size} {...props} />
    </div>
  );
}
