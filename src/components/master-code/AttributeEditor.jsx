import React from 'react'
import {Plus, Trash2} from 'lucide-react'
import {Button} from '../ui/button'
import {Input} from '../ui/input'
import {Label} from '../ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select'

const ATTRIBUTE_TYPES = [
  {value: 'text', label: '텍스트'},
  {value: 'number', label: '숫자'},
  {value: 'boolean', label: '예/아니오'},
]

/**
 * 루트 노드용: 속성 스키마 정의 편집기
 * attributeSchema = [{ key, label, type }]
 */
export function AttributeSchemaEditor({schema, onChange}) {
  const safeSchema = Array.isArray(schema) ? schema : []

  const handleAdd = () => {
    onChange([...safeSchema, {key: '', label: '', type: 'text'}])
  }

  const handleRemove = (index) => {
    onChange(safeSchema.filter((_, i) => i !== index))
  }

  const handleChange = (index, field, value) => {
    const updated = safeSchema.map((item, i) =>
      i === index ? {...item, [field]: value} : item
    )
    onChange(updated)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[color:var(--admin-text)]">속성 스키마 정의</h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5 mr-1"/>추가
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
              <Label className="text-xs">키 (영문)</Label>
              <Input
                value={item.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                placeholder="color"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">표시명</Label>
              <Input
                value={item.label}
                onChange={(e) => handleChange(index, 'label', e.target.value)}
                placeholder="색상"
              />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">타입</Label>
              <Select value={item.type} onValueChange={(val) => handleChange(index, 'type', val)}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-500/10 shrink-0"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="h-3.5 w-3.5"/>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 자식 노드용: 속성값 입력 편집기
 * 부모(루트)의 attributeSchema를 기반으로 폼 필드를 자동 생성
 */
export function AttributeValueEditor({schema, attributes, onChange}) {
  const safeSchema = Array.isArray(schema) ? schema : []
  const safeAttributes = attributes && typeof attributes === 'object' ? attributes : {}

  const handleChange = (key, value) => {
    onChange({...safeAttributes, [key]: value})
  }

  if (safeSchema.length === 0) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-[color:var(--admin-text)]">속성값</h4>
        <p className="text-xs text-[color:var(--admin-text-faint)]">
          루트 노드에 정의된 속성 스키마가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">속성값</h4>
      <div className="space-y-3">
        {safeSchema.map((schemaDef) => {
          const currentValue = safeAttributes[schemaDef.key] ?? ''
          return (
            <div key={schemaDef.key} className="space-y-1">
              <Label>{schemaDef.label || schemaDef.key}</Label>
              {renderAttributeInput(schemaDef, currentValue, (val) => handleChange(schemaDef.key, val))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderAttributeInput(schemaDef, value, onChange) {
  switch (schemaDef.type) {
    case 'number':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schemaDef.label || schemaDef.key}
        />
      )
    case 'boolean':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="선택"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">예 (Y)</SelectItem>
            <SelectItem value="N">아니오 (N)</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'text':
    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schemaDef.label || schemaDef.key}
        />
      )
  }
}
