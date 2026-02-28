import React from 'react'
import {Alert, AlertDescription} from '../ui/alert'
import {Input} from '../ui/input'
import {Label} from '../ui/label'
import {Switch} from '../ui/switch'
import {Textarea} from '../ui/textarea'
import {cn} from '../../lib/utils'

export default function ClassForm({formData, setFormData, dialogMode, originalCode}) {
  const isEdit = dialogMode === 'editClass'
  const codeChanged = isEdit && formData.classCode !== originalCode

  return (
    <div className="space-y-4 pt-2">
      {dialogMode === 'addChildClass' && formData.parentCodeNode && (
        <Alert>
          <AlertDescription>
            부모 코드: <strong>
              {formData.parentCodeNode.classCode} - {formData.parentCodeNode.code} ({formData.parentCodeNode.name})
            </strong>
            <br/>
            이 코드의 하위 클래스로 새로운 클래스가 생성됩니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label>클래스 코드 *</Label>
        <Input
          value={formData.classCode}
          onChange={(e) => setFormData(prev => ({...prev, classCode: e.target.value}))}
          className={cn(codeChanged && 'border-yellow-500 focus-visible:ring-yellow-400')}
        />
        <p className={cn('text-xs', codeChanged ? 'text-yellow-600' : 'text-[color:var(--admin-text-faint)]')}>
          {codeChanged
            ? `⚠️ 기존 클래스 코드(${originalCode})가 변경 됩니다.`
            : '영문 대문자와 밑줄(_)만 사용'}
        </p>
      </div>

      <div className="space-y-1">
        <Label>클래스명 *</Label>
        <Input
          value={formData.className}
          onChange={(e) => setFormData(prev => ({...prev, className: e.target.value}))}
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
        <h4 className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">속성 정의</h4>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className="space-y-1">
              <Label>속성{num} 이름</Label>
              <Input
                value={formData[`attribute${num}Name`]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [`attribute${num}Name`]: e.target.value
                }))}
              />
            </div>
          ))}
        </div>
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
