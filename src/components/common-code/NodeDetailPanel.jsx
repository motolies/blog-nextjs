import React from 'react'
import {GitBranch, Code, Pencil, Trash2, Plus, GitMerge} from 'lucide-react'
import {Button} from '../ui/button'
import {Badge} from '../ui/badge'
import {Separator} from '../ui/separator'

export default function NodeDetailPanel({
  selectedNode,
  parentClassNode,
  onEdit,
  onDelete,
  onAddCode,
  onAddChildClass
}) {
  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <p className="text-sm text-[color:var(--admin-text-faint)]">항목을 선택하세요</p>
      </div>
    )
  }

  const isClass = selectedNode.type === 'CLASS'

  const renderTable = (rows) => (
    <table className="w-full text-sm">
      <tbody>
        {rows.filter(Boolean).map(([label, value], i) => (
          <tr key={i} className="border-b border-[color:var(--admin-border)] last:border-0">
            <td className="w-28 py-1.5 pr-3 align-top font-semibold text-[color:var(--admin-text-faint)]">{label}</td>
            <td className="py-1.5 text-[color:var(--admin-text)]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const classRows = [
    ['코드', selectedNode.code],
    ['이름', selectedNode.name],
    ['설명', selectedNode.description || '-'],
    ...[1, 2, 3, 4, 5].map(n => {
      const attrName = selectedNode[`attribute${n}Name`]
      return attrName ? [`속성${n}`, attrName] : null
    }),
    ['상태', (
      <Badge variant={selectedNode.isActive ? 'success' : 'secondary'} className="text-xs">
        {selectedNode.isActive ? '활성' : '비활성'}
      </Badge>
    )],
    ['코드 수', `${selectedNode.codes?.length || 0}개`]
  ]

  const codeRows = [
    ['코드', selectedNode.code],
    ['이름', selectedNode.name],
    ['소속 클래스', selectedNode.classCode],
    ['설명', selectedNode.description || '-'],
    ...(parentClassNode ? [1, 2, 3, 4, 5].map(n => {
      const attrName = parentClassNode[`attribute${n}Name`]
      return attrName ? [attrName, selectedNode[`attribute${n}Value`] || '-'] : null
    }) : []),
    ['정렬순서', selectedNode.sort ?? 0],
    selectedNode.childClass ? ['하위 클래스', (
      <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
        <GitBranch className="h-3 w-3"/>
        {selectedNode.childClass.code} ({selectedNode.childClass.name})
      </Badge>
    )] : null,
    ['상태', (
      <Badge variant={selectedNode.isActive ? 'success' : 'secondary'} className="text-xs">
        {selectedNode.isActive ? '활성' : '비활성'}
      </Badge>
    )]
  ]

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        {isClass
          ? <GitBranch className="h-4 w-4 text-sky-700"/>
          : <Code className="h-4 w-4 text-fuchsia-700"/>
        }
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">{isClass ? '클래스' : '코드'} 상세</span>
        <Badge variant={isClass ? 'default' : 'secondary'} className="text-xs">
          {selectedNode.code}
        </Badge>
      </div>
      <Separator/>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-auto p-2">
        {isClass ? renderTable(classRows) : renderTable(codeRows)}
      </div>

      {/* 액션 버튼 */}
      <Separator/>
      <div className="flex flex-wrap gap-1.5 p-3">
        <Button size="sm" variant="outline" onClick={() => onEdit(selectedNode)}>
          <Pencil className="h-3.5 w-3.5 mr-1"/>편집
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-500/20 text-red-600 hover:bg-red-500/8 hover:text-red-700"
          onClick={() => onDelete(selectedNode)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1"/>삭제
        </Button>
        {isClass ? (
          <Button size="sm" variant="outline" onClick={() => onAddCode(selectedNode)}>
            <Plus className="h-3.5 w-3.5 mr-1"/>코드 추가
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onAddChildClass(selectedNode)}>
            <GitMerge className="h-3.5 w-3.5 mr-1"/>하위 클래스 추가
          </Button>
        )}
      </div>
    </div>
  )
}
