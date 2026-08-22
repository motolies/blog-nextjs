import {
  applyColumnPreference,
  type ColumnDef,
  ColumnSettingsDialog,
  type ColumnWidths,
  useGridPreference,
} from '@hvy/ui';
import { useRouter } from 'next/router';
import { type ReactNode, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { COLUMN_SETTINGS_LABELS } from './gridLabels';
import { resolveGridUserKey } from './gridUserKey';

/**
 * PersistedDataGrid 의 `settings` prop 타입 — 이 훅만이 이 형태를 만들 수 있다.
 * columns·columnWidths·onColumnWidthsChange 를 `gridProps` 로 묶는 이유:
 * 쪼개 받을 수 있으면 폭 배선만 빼먹은 그리드가 컴파일을 통과한다.
 */
export type ColumnSettings<T extends Record<string, unknown>> = {
  /** DataGrid 에 통째로 스프레드한다 — PersistedDataGrid 가 소비한다. */
  readonly gridProps: {
    readonly columns: readonly ColumnDef<T>[];
    readonly columnWidths: ColumnWidths;
    readonly onColumnWidthsChange: (next: ColumnWidths) => void;
  };
  readonly openSettings: () => void;
  /** PersistedDataGrid 가 렌더한다 — 페이지가 직접 렌더하지 않는다(이중 렌더 방지). */
  readonly dialog: ReactNode;
};

/**
 * 컬럼 표시/순서/폭 설정 훅 — useGridPreference 로 localStorage 에 영속화한다
 * (키: `nx:grid:{username}:{pathname}:{gridId}`).
 *
 * gridId 는 한 화면 안에서 그리드를 구분하는 **필수** 인자다 — 1그리드 페이지도 명시한다.
 * memo 처럼 같은 경로 아래 탭 뒤 그리드가 늘어나면 기본값은 조용히 서로를 덮어쓴다
 * (동시 마운트가 아니라 useGridPreference 의 중복 키 경고도 침묵한다).
 *
 * ⚠️ columns 는 참조가 안정해야 한다(useMemo 또는 모듈 상수) — 매 렌더 새 배열이면
 * applyColumnPreference 가 계속 다시 계산된다.
 */
export function useColumnSettings<T extends Record<string, unknown>>(
  columns: readonly ColumnDef<T>[],
  gridId: string,
): ColumnSettings<T> {
  // admin 은 전부 정적 경로라 pathname 이 곧 메뉴 축이다. 사용자 축은 프로필 로드 전
  // 공백 프레임이 있어 resolveGridUserKey 가 fallback 으로 격리한다.
  const { pathname } = useRouter();
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

  const dialog = (
    <ColumnSettingsDialog
      open={open}
      onOpenChange={setOpen}
      columns={columns}
      preference={preference.preference}
      // widths 보존은 useGridPreference.setPreference 내부가 한다 — 수동 병합 불요.
      onApply={preference.setPreference}
      // reset 은 저장소 삭제 + 디바운스 대기분 폐기까지 포함한다.
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
  };
}
