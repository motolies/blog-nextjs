import {
  applyColumnPreference,
  type ColumnDef,
  ColumnSettingsDialog,
  type ColumnWidths,
  useGridPreference,
} from '@hvy/ui';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import { type GridPagingControl, resolvePageSize } from '@/lib/gridPaging';
import { useAuthStore } from '@/store/useAuthStore';
import { COLUMN_SETTINGS_LABELS } from './gridLabels';
import { resolveGridUserKey } from './gridUserKey';

/**
 * PersistedDataGrid 의 `settings` prop 타입 — 이 훅만이 이 형태를 만들 수 있다.
 * columns·columnWidths·onColumnWidthsChange 를 `gridProps` 로 묶는 이유:
 * 쪼개 받을 수 있으면 폭 배선만 빼먹은 그리드가 컴파일을 통과한다.
 */
export type GridSettings<T extends Record<string, unknown>> = {
  /** DataGrid 에 통째로 스프레드한다 — PersistedDataGrid 가 소비한다. */
  readonly gridProps: {
    readonly columns: readonly ColumnDef<T>[];
    readonly columnWidths: ColumnWidths;
    readonly onColumnWidthsChange: (next: ColumnWidths) => void;
  };
  readonly openSettings: () => void;
  /** PersistedDataGrid 가 렌더한다 — 페이지가 직접 렌더하지 않는다(이중 렌더 방지). */
  readonly dialog: ReactNode;
  /**
   * useServerGrid/useClientGrid 의 `paging` 옵션에 그대로 넘긴다 — 페이지 크기의 진실은 저장소다.
   * 훅 호출 순서: **settings 를 grid 보다 먼저** 호출해야 이 값을 넘길 수 있다.
   */
  readonly paging: GridPagingControl;
};

/**
 * 그리드 표시 설정(컬럼 표시/순서/폭 + 페이지 크기) 훅 — useGridPreference 로 localStorage 에
 * 영속화한다(키: `nx:grid:{username}:{pathname}:{gridId}`).
 *
 * 페이지 크기도 이 훅이 소유하는 이유: 한 저장 키에 useGridPreference 인스턴스는 하나여야 한다
 * (중복 키 경고). 컬럼과 페이지 크기의 키 3축(사용자·메뉴·그리드)이 정확히 같은 스코프라
 * 훅을 나누면 같은 키를 두 인스턴스가 쓰게 된다.
 *
 * gridId 는 한 화면 안에서 그리드를 구분하는 **필수** 인자다 — 1그리드 페이지도 명시한다.
 * memo 처럼 같은 경로 아래 탭 뒤 그리드가 늘어나면 기본값은 조용히 서로를 덮어쓴다
 * (동시 마운트가 아니라 useGridPreference 의 중복 키 경고도 침묵한다).
 *
 * ⚠️ columns 는 참조가 안정해야 한다(useMemo 또는 모듈 상수) — 매 렌더 새 배열이면
 * applyColumnPreference 가 계속 다시 계산된다.
 *
 * ⚠️ 첫 조회는 저장된 페이지 크기를 모른 채 나간다. 첫 렌더는 SSR 호환을 위해 preference 가 null
 * 이고(effect 에서 로드), 사용자 축도 프로필 로드 전에는 anonymous 라 진짜 키는 username 도착 후에
 * 읽힌다. 저장된 크기가 기본값(10)과 다르면 **요청이 정확히 1회 더** 나가고 앞선 응답은
 * useServerGrid 의 requestRef 가 버린다. 같거나 저장이 없으면 추가 요청은 없다.
 * 프로필을 기다렸다 조회하면 모든 admin 목록의 첫 데이터가 프로필 RTT 만큼 늦어지므로 받아들인다.
 */
export function useGridSettings<T extends Record<string, unknown>>(
  columns: readonly ColumnDef<T>[],
  gridId: string,
): GridSettings<T> {
  // admin 은 전부 정적 경로라 pathname 이 곧 메뉴 축이다(usePathname 은 실제 경로를 주지만 그리드
  // 페이지는 동적 세그먼트가 없어 저장 키가 불변). 사용자 축은 프로필 로드 전
  // 공백 프레임이 있어 resolveGridUserKey 가 fallback 으로 격리한다.
  const pathname = usePathname();
  const username = useAuthStore((s) => s.user.username);
  const preference = useGridPreference({
    userKey: resolveGridUserKey(username),
    menuUrl: pathname,
    gridId,
  });
  const [open, setOpen] = useState(false);

  const visibleColumns = useMemo(
    () => applyColumnPreference(columns, preference.preference),
    [columns, preference.preference],
  );

  // 저장값이 허용 목록 밖이면 기본값 — Select 는 목록에 없는 값을 placeholder 로 그린다.
  // deps 를 preference 객체가 아니라 두 필드로 두는 이유: 폭 드래그마다 preference 참조가 바뀌는데,
  // 그때마다 paging 이 새 객체면 이를 받는 grid 훅 쪽이 불필요하게 다시 계산한다.
  const paging = useMemo<GridPagingControl>(
    () => ({
      pageSize: resolvePageSize(preference.pageSize),
      onPageSizeChange: preference.setPageSize,
    }),
    [preference.pageSize, preference.setPageSize],
  );

  const dialog = (
    <ColumnSettingsDialog
      open={open}
      onOpenChange={setOpen}
      columns={columns}
      preference={preference.preference}
      // widths 보존은 useGridPreference.setPreference 내부가 한다 — 수동 병합 불요.
      onApply={preference.setPreference}
      // reset 은 컬럼 설정 삭제 + 디바운스 대기분 폐기까지 포함한다. 페이지 크기는 남는다.
      onReset={preference.reset}
      translateHeader={(code) => code}
      labels={COLUMN_SETTINGS_LABELS}
    />
  );

  return {
    gridProps: {
      columns: visibleColumns,
      // 항상 객체다 — undefined 로 두면 그리드가 uncontrolled 로 전환되어 폭의 진실이 갈린다.
      columnWidths: preference.widths,
      onColumnWidthsChange: preference.setWidths,
    },
    openSettings: () => setOpen(true),
    dialog,
    paging,
  };
}
