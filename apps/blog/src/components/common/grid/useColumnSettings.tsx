import {
  applyColumnPreference,
  type ColumnDef,
  ColumnSettingsDialog,
  type GridPreference,
} from '@hvy/ui';
import { useMemo, useState } from 'react';
import { COLUMN_SETTINGS_LABELS } from './gridLabels';

/**
 * 컬럼 표시/순서 설정 훅 — GridPreference state 와 한국어 라벨이 박힌
 * ColumnSettingsDialog 를 한 쌍으로 돌려준다. `dialog` 는 페이지 JSX 말미에 렌더한다.
 */
export function useColumnSettings<T>(columns: readonly ColumnDef<T>[]) {
  const [preference, setPreference] = useState<GridPreference | null>(null);
  const [open, setOpen] = useState(false);

  const visibleColumns = useMemo(
    () => applyColumnPreference(columns as ColumnDef<T>[], preference),
    [columns, preference],
  );

  const dialog = (
    <ColumnSettingsDialog
      open={open}
      onOpenChange={setOpen}
      columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
      preference={preference}
      onApply={(next) => setPreference({ version: 1, widths: preference?.widths ?? {}, ...next })}
      onReset={() => setPreference(null)}
      translateHeader={(code) => code}
      labels={COLUMN_SETTINGS_LABELS}
    />
  );

  return { visibleColumns, openSettings: () => setOpen(true), dialog };
}
