import { Label, Select } from '@hvy/ui';

/**
 * 라벨 붙은 필터 select 한 칸 — KPI·가중치 탭의 URL 상태 필터(기간·종류·호라이즌)가 같은 모양을 쓴다.
 * `Select` 는 aria-label 을 받지 않아 `Label htmlFor` 로 이름을 붙인다.
 * 폭은 옵션 문구가 정하고 좁은 화면에서만 한 줄을 다 쓴다(치수 리터럴 없이).
 */
export function FilterSelect({
  id,
  label,
  value,
  options,
  onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
      <Label htmlFor={id} className="text-dl-xs text-dl-fg-muted">
        {label}
      </Label>
      <Select
        id={id}
        size="sm"
        value={value}
        onValueChange={onValueChange}
        placeholder={label}
        options={options}
        className="w-full"
      />
    </div>
  );
}
