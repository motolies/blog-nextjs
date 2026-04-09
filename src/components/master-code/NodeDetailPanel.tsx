import React from 'react'
import {Folder, Code, Pencil, Trash2, Plus} from 'lucide-react'
import {Button} from '../ui/button'
import {Badge} from '../ui/badge'
import {Separator} from '../ui/separator'

interface AttributeSchemaItem {
  key: string
  label: string
  type: string
}

interface MasterCodeNode {
  id: number
  code: string
  name: string
  description?: string
  sort?: number
  isActive: boolean
  depth: number
  parentId?: number | null
  children?: MasterCodeNode[]
  attributeSchema?: AttributeSchemaItem[]
  attributes?: Record<string, string>
}

interface NodeDetailPanelProps {
  selectedNode: MasterCodeNode | null
  rootAttributeSchema?: AttributeSchemaItem[]
  onEdit: (node: MasterCodeNode) => void
  onDelete: (node: MasterCodeNode) => void
  onAddChild: (node: MasterCodeNode) => void
}

export default function NodeDetailPanel({
  selectedNode,
  rootAttributeSchema,
  onEdit,
  onDelete,
  onAddChild,
}: NodeDetailPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <p className="text-sm text-[color:var(--admin-text-faint)]">항목을 선택하세요</p>
      </div>
    )
  }

  const isRoot = selectedNode.depth === 0

  const renderTable = (rows: ([string, React.ReactNode] | false | null | undefined)[]) => (
    <table className="w-full text-sm">
      <tbody>
        {(rows.filter(Boolean) as [string, React.ReactNode][]).map(([label, value], i) =>
          label === '__separator' ? (
            <tr key={i}>
              <td colSpan={2} className="pt-5 pb-1 text-sm font-semibold text-[color:var(--admin-text-faint)]">{value}</td>
            </tr>
          ) : (
            <tr key={i} className="border-b border-[color:var(--admin-border)] last:border-0">
              <td className="w-28 py-1.5 pr-3 align-top font-semibold text-[color:var(--admin-text-faint)]">{label}</td>
              <td className="py-1.5 text-[color:var(--admin-text)]">{value}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  )

  // 기본 정보 행
  const baseRows: [string, React.ReactNode][] = [
    ['코드', selectedNode.code],
    ['이름', selectedNode.name],
    ['설명', selectedNode.description || '-'],
    ['정렬순서', selectedNode.sort ?? 0],
    ['상태', (
      <Badge variant={selectedNode.isActive ? 'success' : 'secondary'} className="text-xs">
        {selectedNode.isActive ? '활성' : '비활성'}
      </Badge>
    )],
  ]

  // 루트 노드: attributeSchema 표시
  const schemaRows: [string, React.ReactNode][] = isRoot && Array.isArray(selectedNode.attributeSchema) && selectedNode.attributeSchema.length > 0
    ? selectedNode.attributeSchema.map((s, idx) => [
        `속성${idx + 1}`,
        <span key={idx}>
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{s.key}</code>
          <span className="ml-1.5 text-[color:var(--admin-text-secondary)]">{s.label}</span>
          <Badge variant="outline" className="ml-1.5 text-[10px]">{s.type}</Badge>
        </span>
      ])
    : []

  // 자식 노드: attributes 값 표시 (rootAttributeSchema의 label 활용)
  const attrRows: [string, React.ReactNode][] = !isRoot && selectedNode.attributes && typeof selectedNode.attributes === 'object'
    ? Object.entries(selectedNode.attributes)
        .filter(([, v]) => v != null && v !== '')
        .map(([key, value]) => {
          const schemaDef = rootAttributeSchema?.find(s => s.key === key)
          return [schemaDef?.label || key, String(value)]
        })
    : []

  // 자식 수 (있는 경우)
  const childCountRow: [string, React.ReactNode][] = Array.isArray(selectedNode.children) && selectedNode.children.length > 0
    ? [['하위 노드', `${selectedNode.children.length}개`]]
    : []

  // 속성값이 있으면 구분용 빈 행 추가
  const attrSection: ([string, React.ReactNode])[] = attrRows.length > 0
    ? [['__separator', '속성값'], ...attrRows]
    : []

  const allRows: ([string, React.ReactNode] | false | null | undefined)[] = [
    ...baseRows,
    ...childCountRow,
    ...schemaRows,
    ...attrSection,
  ]

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        {isRoot
          ? <Folder className="h-4 w-4 text-sky-700"/>
          : <Code className="h-4 w-4 text-fuchsia-700"/>
        }
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">
          {isRoot ? '루트 노드' : '노드'} 상세
        </span>
        <Badge variant={isRoot ? 'default' : 'secondary'} className="text-xs">
          {selectedNode.code}
        </Badge>
      </div>
      <Separator/>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-auto p-2">
        {renderTable(allRows)}
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
        <Button size="sm" variant="outline" onClick={() => onAddChild(selectedNode)}>
          <Plus className="h-3.5 w-3.5 mr-1"/>하위 노드 추가
        </Button>
      </div>
    </div>
  )
}
