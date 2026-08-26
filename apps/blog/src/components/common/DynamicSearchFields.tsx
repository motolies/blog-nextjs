import {
  Button,
  DateRangePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  IconButton,
  Input,
  Label,
  Select,
} from '@hvy/ui';
import {
  Plus as AddIcon,
  Check as CheckIcon,
  X as CloseIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DATE_RANGE_PRESETS } from './searchPresets';

const SELECT_EMPTY_VALUE = '__SELECT_EMPTY__';

interface SelectOption {
  value: string | number;
  label: string;
}

interface BaseSearchField {
  name: string;
  label: string;
  type?: string;
  pinned?: boolean;
  defaultValue?: string;
  options?: SelectOption[];
}

interface DateRangeSearchField {
  type: 'dateRange';
  fromName: string;
  toName: string;
  fromLabel: string;
  toLabel: string;
  pinned?: boolean;
}

interface NumberRangeSearchField {
  type: 'numberRange';
  fromName: string;
  toName: string;
  fromLabel: string;
  toLabel: string;
  pinned?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  integerOnly?: boolean;
}

type RangeSearchField = DateRangeSearchField | NumberRangeSearchField;
type SearchField = BaseSearchField | DateRangeSearchField | NumberRangeSearchField;

/**
 * 필드의 고유 키를 반환
 */
const isRangeField = (field: SearchField): field is RangeSearchField =>
  field.type === 'dateRange' || field.type === 'numberRange';

const getFieldKey = (field: SearchField): string => {
  if (isRangeField(field)) return field.fromName;
  return (field as BaseSearchField).name;
};

/**
 * 필드의 라벨을 반환
 */
const getFieldLabel = (field: SearchField): string => {
  if (isRangeField(field)) {
    return `${field.fromLabel} ~ ${field.toLabel}`;
  }
  return (field as BaseSearchField).label;
};

/**
 * 검색 필드 렌더링
 */
const renderField = (
  field: SearchField,
  searchInputs: Record<string, unknown>,
  onInputChange: (name: string, value: string) => void,
  onKeyDown: (e: React.KeyboardEvent) => void,
) => {
  if (field.type === 'dateRange') {
    const df = field as DateRangeSearchField;
    return (
      // 다른 검색 필드와 같은 규격(라벨 위 · gap 1) — 기간만 라벨이 없으면 무슨 날짜인지 알 수 없다.
      <div key={df.fromName} className="flex flex-col gap-1">
        <span className="text-dl-xs text-dl-fg-muted">{getFieldLabel(df)}</span>
        <DateRangePicker
          size="sm"
          className="w-auto"
          // 달력 팝오버 상단 칩 행. 클릭해도 입력만 채우고 조회는 [검색]이 돈다 —
          // 달력에서 날짜를 고를 때와 같은 커밋 경로(onRangeChange)를 지난다.
          presets={DATE_RANGE_PRESETS}
          start={String(searchInputs[df.fromName] || '')}
          end={String(searchInputs[df.toName] || '')}
          onRangeChange={({ start, end }) => {
            onInputChange(df.fromName, start);
            onInputChange(df.toName, end);
          }}
        />
      </div>
    );
  }

  if (field.type === 'numberRange') {
    const nf = field as NumberRangeSearchField;
    const inputMin = nf.allowNegative === false ? Math.max(0, nf.min ?? 0) : nf.min;
    const inputStep = nf.integerOnly ? 1 : undefined;
    return (
      <div key={nf.fromName} className="flex flex-col gap-1">
        <Label
          htmlFor={`dsf-${nf.fromName}`}
          className="text-dl-xs text-dl-fg-muted"
        >{`${nf.fromLabel} ~ ${nf.toLabel}`}</Label>
        <div className="flex items-center gap-1">
          <Input
            id={`dsf-${nf.fromName}`}
            type="number"
            value={String(searchInputs[nf.fromName] ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onInputChange(nf.fromName, e.target.value)
            }
            onKeyDown={onKeyDown}
            size="sm"
            className="w-[90px]"
            placeholder={nf.fromLabel}
            min={inputMin}
            max={nf.max}
            step={inputStep}
          />
          <span className="text-dl-fg-muted text-dl-xs">~</span>
          <Input
            type="number"
            value={String(searchInputs[nf.toName] ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onInputChange(nf.toName, e.target.value)
            }
            onKeyDown={onKeyDown}
            size="sm"
            className="w-[90px]"
            placeholder={nf.toLabel}
            min={inputMin}
            max={nf.max}
            step={inputStep}
          />
        </div>
      </div>
    );
  }

  const baseField = field as BaseSearchField;

  if (baseField.type === 'select') {
    const rawValue = searchInputs[baseField.name];
    const selectValue =
      rawValue === undefined || rawValue === null || rawValue === ''
        ? SELECT_EMPTY_VALUE
        : String(rawValue);

    return (
      <div key={baseField.name} className="flex flex-col gap-1">
        <Label htmlFor={`dsf-${baseField.name}`} className="text-dl-xs text-dl-fg-muted">
          {baseField.label}
        </Label>
        <Select
          id={`dsf-${baseField.name}`}
          value={selectValue}
          onValueChange={(val: string) =>
            onInputChange(baseField.name, val === SELECT_EMPTY_VALUE ? '' : val)
          }
          placeholder="전체"
          size="sm"
          options={[
            { value: SELECT_EMPTY_VALUE, label: '전체' },
            ...(baseField.options ?? []).map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            })),
          ]}
          className="min-w-[120px]"
        />
      </div>
    );
  }

  return (
    <div key={baseField.name} className="flex flex-col gap-1">
      <Label htmlFor={`dsf-${baseField.name}`} className="text-dl-xs text-dl-fg-muted">
        {baseField.label}
      </Label>
      <Input
        id={`dsf-${baseField.name}`}
        type={baseField.type || 'text'}
        value={String(searchInputs[baseField.name] ?? '')}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onInputChange(baseField.name, e.target.value)
        }
        onKeyDown={onKeyDown}
        size="sm"
        className="min-w-[120px]"
        placeholder={baseField.label}
      />
    </div>
  );
};

interface DynamicSearchFieldsProps {
  searchFields: SearchField[];
  searchInputs: Record<string, unknown>;
  defaultSearchParams: Record<string, unknown>;
  onInputChange: (name: string, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  enableDynamic?: boolean;
}

/**
 * 데이터 테이블용 검색 필드 컴포넌트
 *
 * enableDynamic=false: 기존 방식 (모든 필드 일렬 표시)
 * enableDynamic=true: pinned/dynamic 분리 + 필드 추가 메뉴
 * Enter 키 → onSearch 는 내부에서 처리한다 — 모든 소비자가 같은 동작만 원했다.
 */
export default function DynamicSearchFields({
  searchFields,
  searchInputs,
  defaultSearchParams,
  onInputChange,
  onSearch,
  onReset,
  enableDynamic = false,
}: DynamicSearchFieldsProps) {
  const [activeFields, setActiveFields] = useState<string[]>([]);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  // defaultSearchParams에 값이 있는 동적 필드는 자동 활성화
  useEffect(() => {
    if (!enableDynamic) return;

    const dynamicFields = searchFields.filter((f) => !f.pinned);
    const autoActive = dynamicFields
      .filter((field) => {
        const key = getFieldKey(field);
        if (isRangeField(field)) {
          return defaultSearchParams[field.fromName] || defaultSearchParams[field.toName];
        }
        return defaultSearchParams[key];
      })
      .map(getFieldKey);

    if (autoActive.length > 0) {
      setActiveFields(autoActive);
    }
  }, []); // 초기 마운트 시 1회만

  // 기존 방식 (enableDynamic=false)
  if (!enableDynamic) {
    return (
      <div className="shrink-0 rounded-dl-container border bg-dl-surface p-3 mb-3">
        <div className="flex flex-wrap items-end gap-2">
          {searchFields.map((field) =>
            renderField(field, searchInputs, onInputChange, handleKeyDown),
          )}
          <Button variant="primary" size="sm" icon={SearchIcon} onClick={onSearch}>
            검색
          </Button>
          <Button variant="outline-gray" size="sm" icon={RefreshIcon} onClick={onReset}>
            초기화
          </Button>
        </div>
      </div>
    );
  }

  // 동적 모드
  const pinnedFields = searchFields.filter((f) => f.pinned === true);
  const dynamicFields = searchFields.filter((f) => f.pinned !== true);
  const visibleDynamic = dynamicFields.filter((f) => activeFields.includes(getFieldKey(f)));

  const handleAddField = (field: SearchField) => {
    const key = getFieldKey(field);
    if (!activeFields.includes(key)) {
      setActiveFields((prev) => [...prev, key]);
      if ((field as BaseSearchField).defaultValue !== undefined) {
        onInputChange((field as BaseSearchField).name, (field as BaseSearchField).defaultValue!);
      }
    }

    // 추가 후 해당 필드로 포커스
    setTimeout(() => {
      const ref = fieldRefs.current[key];
      if (ref) {
        const input = ref.querySelector('input');
        if (input) input.focus();
      }
    }, 100);
  };

  const handleRemoveField = (field: SearchField) => {
    const key = getFieldKey(field);
    setActiveFields((prev) => prev.filter((k) => k !== key));

    // 값 초기화
    if (isRangeField(field)) {
      onInputChange(field.fromName, '');
      onInputChange(field.toName, '');
    } else {
      onInputChange((field as BaseSearchField).name, '');
    }
  };

  const handleResetAll = () => {
    setActiveFields([]);
    onReset();
  };

  return (
    <div className="shrink-0 rounded-dl-container border bg-dl-surface p-3 mb-3">
      {/* Row 1: Pinned 필드 + 검색/초기화 버튼 */}
      <div className="flex flex-wrap items-end gap-2">
        {pinnedFields.map((field) =>
          renderField(field, searchInputs, onInputChange, handleKeyDown),
        )}
        <Button variant="primary" size="sm" icon={SearchIcon} onClick={onSearch}>
          검색
        </Button>
        <Button variant="outline-gray" size="sm" icon={RefreshIcon} onClick={handleResetAll}>
          초기화
        </Button>
      </div>

      {/* Row 2: 검색 조건 추가 버튼 */}
      {dynamicFields.length > 0 && (
        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="sm"
                icon={AddIcon}
                className="text-dl-fg-muted hover:text-dl-fg"
              >
                검색 조건 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {dynamicFields.map((field) => {
                const key = getFieldKey(field);
                const isActive = activeFields.includes(key);
                return (
                  <DropdownMenuItem key={key} onSelect={() => handleAddField(field)}>
                    <span className="flex items-center gap-2 w-full">
                      {isActive ? (
                        <Icon icon={CheckIcon} className="text-dl-primary" />
                      ) : (
                        <span className="size-dl-ic-sm" />
                      )}
                      {getFieldLabel(field)}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Row 3: 동적 추가된 필드들 */}
      {visibleDynamic.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 mt-3">
          {visibleDynamic.map((field) => {
            const key = getFieldKey(field);
            return (
              <div
                key={key}
                ref={(el: HTMLDivElement | null) => {
                  fieldRefs.current[key] = el;
                }}
                className="flex items-end gap-1"
              >
                {renderField(field, searchInputs, onInputChange, handleKeyDown)}
                <IconButton
                  icon={CloseIcon}
                  label="검색 조건 제거"
                  size="xs"
                  iconSize="sm"
                  className="text-dl-fg-muted hover:text-dl-danger"
                  onClick={() => handleRemoveField(field)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
