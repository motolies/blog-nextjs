import React from 'react'
import {Input} from '../ui/input'
import {Label} from '../ui/label'
import {Switch} from '../ui/switch'
import {Textarea} from '../ui/textarea'
import {cn} from '../../lib/utils'
import {AttributeSchemaEditor, AttributeValueEditor} from './AttributeEditor'

interface AttributeSchemaItem {
  key: string
  label: string
  type: string
}

interface NodeFormData {
  code: string
  name: string
  description: string
  sort: number
  isActive: boolean
  isRoot: boolean
  parentId: number | null
  attributeSchema: AttributeSchemaItem[]
  attributes: Record<string, string>
}

interface ParentNode {
  id: number
  code: string
  name: string
}

type DialogMode = 'addRoot' | 'addChild' | 'edit'

interface NodeFormProps {
  formData: NodeFormData
  setFormData: React.Dispatch<React.SetStateAction<NodeFormData>>
  dialogMode: DialogMode | null
  originalCode: string
  parentNode: ParentNode | null
  rootAttributeSchema: AttributeSchemaItem[]
}

export default function NodeForm({
  formData,
  setFormData,
  dialogMode,
  originalCode,
  parentNode,
  rootAttributeSchema,
}: NodeFormProps) {
  const isEdit = dialogMode === 'edit'
  const isRoot = dialogMode === 'addRoot' || (isEdit && formData.isRoot)
  const codeChanged = isEdit && formData.code !== originalCode

  return (
    <div className="space-y-4 pt-2">
      {/* 부모 노드 정보 (자식 추가 시) */}
      {dialogMode === 'addChild' && parentNode && (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
          <p className="text-sm text-[color:var(--admin-text-secondary)]">
            부모 노드: <strong>{parentNode.code} ({parentNode.name})</strong>
          </p>
          <p className="mt-0.5 text-xs text-[color:var(--admin-text-faint)]">
            이 노드의 하위에 새 노드가 생성됩니다.
          </p>
        </div>
      )}

      {/* 코드 */}
      <div className="space-y-1">
        <Label>코드 *</Label>
        <Input
          value={formData.code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({...prev, code: e.target.value}))}
          className={cn(codeChanged && 'border-yellow-500 focus-visible:ring-yellow-400')}
        />
        <p className={cn('text-xs', codeChanged ? 'text-yellow-600' : 'text-[color:var(--admin-text-faint)]')}>
          {codeChanged
            ? `기존 코드(${originalCode})가 변경됩니다.`
            : '영문 대문자와 밑줄(_)만 사용'}
        </p>
      </div>

      {/* 이름 */}
      <div className="space-y-1">
        <Label>이름 *</Label>
        <Input
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({...prev, name: e.target.value}))}
        />
      </div>

      {/* 설명 */}
      <div className="space-y-1">
        <Label>설명</Label>
        <Textarea
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({...prev, description: e.target.value}))}
          rows={3}
        />
      </div>

      {/* 정렬순서 */}
      <div className="space-y-1">
        <Label>정렬순서</Label>
        <Input
          type="number"
          value={formData.sort}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
            ...prev,
            sort: parseInt(e.target.value) || 0
          }))}
        />
      </div>

      {/* 활성화 여부 */}
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({...prev, isActive: checked}))}
        />
        <Label>활성화</Label>
      </div>

      {/* 루트: 속성 스키마 편집 / 자식: 속성값 편집 */}
      {isRoot ? (
        <AttributeSchemaEditor
          schema={formData.attributeSchema}
          onChange={(schema: AttributeSchemaItem[]) => setFormData(prev => ({...prev, attributeSchema: schema}))}
        />
      ) : (
        <AttributeValueEditor
          schema={rootAttributeSchema || []}
          attributes={formData.attributes}
          onChange={(attributes: Record<string, string>) => setFormData(prev => ({...prev, attributes}))}
        />
      )}
    </div>
  )
}
