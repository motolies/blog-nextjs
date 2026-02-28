import React from 'react'
import {Input} from '../ui/input'
import {Label} from '../ui/label'
import {Switch} from '../ui/switch'
import {Textarea} from '../ui/textarea'
import {cn} from '../../lib/utils'

export default function CodeForm({formData, setFormData, dialogMode, originalCode, parentClassNode}) {
  const isEdit = dialogMode === 'editCode'
  const codeChanged = isEdit && formData.code !== originalCode

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>소속 클래스 코드</Label>
        <Input value={formData.codeClassCode} disabled/>
      </div>

      <div className="space-y-1">
        <Label>코드값 *</Label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
          className={cn(codeChanged && 'border-yellow-500 focus-visible:ring-yellow-400')}
        />
        <p className={cn('text-xs', codeChanged ? 'text-yellow-600' : 'text-[color:var(--admin-text-faint)]')}>
          {codeChanged
            ? `⚠️ 기존 코드(${originalCode})가 변경 됩니다.`
            : '영문 대문자와 밑줄(_)만 사용'}
        </p>
      </div>

      <div className="space-y-1">
        <Label>코드명 *</Label>
        <Input
          value={formData.codeName}
          onChange={(e) => setFormData(prev => ({...prev, codeName: e.target.value}))}
        />
      </div>

      <div className="space-y-1">
        <Label>설명</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
          rows={3}
        />
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">속성 값</h4>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(num => {
            const attrName = parentClassNode?.[`attribute${num}Name`]
            return (
              <div key={num} className="space-y-1">
                <Label>{attrName || `속성${num} 값`}</Label>
                <Input
                  value={formData[`attribute${num}Value`]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [`attribute${num}Value`]: e.target.value
                  }))}
                  disabled={!attrName}
                />
                {!attrName && (
                  <p className="text-xs text-[color:var(--admin-text-faint)]">(부모 클래스에 속성명 미정의)</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <Label>하위 클래스 코드</Label>
        <Input
          value={formData.childClassCode}
          onChange={(e) => setFormData(prev => ({...prev, childClassCode: e.target.value}))}
          placeholder="재귀 구조용 (선택사항)"
        />
      </div>

      <div className="space-y-1">
        <Label>정렬순서</Label>
        <Input
          type="number"
          value={formData.sort}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            sort: parseInt(e.target.value) || 0
          }))}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))}
        />
        <Label>활성화</Label>
      </div>
    </div>
  )
}
