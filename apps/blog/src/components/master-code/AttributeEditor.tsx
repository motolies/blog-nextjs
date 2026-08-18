import { Button, Input, Label, Select, Switch } from '@hvy/ui';
import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';

const ATTRIBUTE_TYPES = [
  { value: 'text', label: '텍스트' },
  { value: 'number', label: '숫자' },
  { value: 'boolean', label: '예/아니오' },
] as const;

interface AttributeSchemaItem {
  key: string;
  label: string;
  type: string;
  // 'true'이면 공개(비관리자) 응답에서 백엔드가 이 속성을 제거한다. 없으면 false(공개)로 간주.
  sensitive?: string;
}

interface AttributeSchemaEditorProps {
  schema: AttributeSchemaItem[];
  onChange: (schema: AttributeSchemaItem[]) => void;
}

/**
 * 루트 노드용: 속성 스키마 정의 편집기
 * attributeSchema = [{ key, label, type }]
 */
export function AttributeSchemaEditor({ schema, onChange }: AttributeSchemaEditorProps) {
  const safeSchema = Array.isArray(schema) ? schema : [];

  const handleAdd = () => {
    onChange([...safeSchema, { key: '', label: '', type: 'text', sensitive: 'false' }]);
  };

  const handleRemove = (index: number) => {
    onChange(safeSchema.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof AttributeSchemaItem, value: string) => {
    const updated = safeSchema.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(updated);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[color:var(--admin-text)]">속성 스키마 정의</h4>
        <Button type="button" variant="outline-gray" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          추가
        </Button>
      </div>

      {safeSchema.length === 0 && (
        <p className="text-xs text-[color:var(--admin-text-faint)]">
          정의된 속성이 없습니다. 추가 버튼을 눌러 속성 스키마를 정의하세요.
        </p>
      )}

      <div className="space-y-3">
        {safeSchema.map((item, index) => (
          <div
            key={index}
            className="flex items-end gap-2 rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)] p-3"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={`attr-key-${index}`} className="text-xs">
                키 (영문)
              </Label>
              <Input
                id={`attr-key-${index}`}
                value={item.key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, 'key', e.target.value)
                }
                placeholder="color"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`attr-label-${index}`} className="text-xs">
                표시명
              </Label>
              <Input
                id={`attr-label-${index}`}
                value={item.label}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, 'label', e.target.value)
                }
                placeholder="색상"
              />
            </div>
            <div className="w-28 space-y-1">
              <Label htmlFor={`attr-type-${index}`} className="text-xs">
                타입
              </Label>
              <Select
                id={`attr-type-${index}`}
                value={item.type}
                onValueChange={(val: string) => handleChange(index, 'type', val)}
                placeholder="타입"
                options={ATTRIBUTE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
            <div className="shrink-0 space-y-1">
              <Label htmlFor={`attr-sensitive-${index}`} className="text-xs">
                민감
              </Label>
              <div className="flex h-9 items-center justify-center">
                <Switch
                  id={`attr-sensitive-${index}`}
                  label="민감 속성"
                  checked={item.sensitive === 'true'}
                  onCheckedChange={(checked: boolean) =>
                    handleChange(index, 'sensitive', checked ? 'true' : 'false')
                  }
                  aria-label="민감 속성 여부"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-dl-danger hover:text-dl-danger-hover hover:bg-dl-danger-bg shrink-0"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AttributeValueEditorProps {
  schema: AttributeSchemaItem[];
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
}

/**
 * 자식 노드용: 속성값 입력 편집기
 * 부모(루트)의 attributeSchema를 기반으로 폼 필드를 자동 생성
 */
export function AttributeValueEditor({ schema, attributes, onChange }: AttributeValueEditorProps) {
  const safeSchema = Array.isArray(schema) ? schema : [];
  const safeAttributes = attributes && typeof attributes === 'object' ? attributes : {};

  const handleChange = (key: string, value: string) => {
    onChange({ ...safeAttributes, [key]: value });
  };

  if (safeSchema.length === 0) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-[color:var(--admin-text)]">속성값</h4>
        <p className="text-xs text-[color:var(--admin-text-faint)]">
          루트 노드에 정의된 속성 스키마가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">속성값</h4>
      <div className="space-y-3">
        {safeSchema.map((schemaDef) => {
          const currentValue = safeAttributes[schemaDef.key] ?? '';
          return (
            <div key={schemaDef.key} className="space-y-1">
              <Label htmlFor={`attr-value-${schemaDef.key}`}>
                {schemaDef.label || schemaDef.key}
              </Label>
              {renderAttributeInput(
                `attr-value-${schemaDef.key}`,
                schemaDef,
                currentValue,
                (val: string) => handleChange(schemaDef.key, val),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 스키마 타입별 입력 컨트롤. `id` 는 바깥 `<Label htmlFor>` 와 짝이라 선택이 아니다. */
function renderAttributeInput(
  id: string,
  schemaDef: AttributeSchemaItem,
  value: string,
  onChange: (val: string) => void,
): React.ReactNode {
  switch (schemaDef.type) {
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={schemaDef.label || schemaDef.key}
        />
      );
    case 'boolean':
      return (
        <Select
          id={id}
          value={value || ''}
          onValueChange={onChange}
          placeholder="선택"
          options={[
            { value: 'Y', label: '예 (Y)' },
            { value: 'N', label: '아니오 (N)' },
          ]}
        />
      );
    default:
      return (
        <Input
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={schemaDef.label || schemaDef.key}
        />
      );
  }
}
