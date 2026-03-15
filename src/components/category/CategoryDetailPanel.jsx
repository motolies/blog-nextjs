import {Folder, FolderTree, Pencil, Trash2, Plus} from 'lucide-react'
import {Button} from '../ui/button'
import {Badge} from '../ui/badge'
import {Separator} from '../ui/separator'

export default function CategoryDetailPanel({
  selectedNode,
  parentName,
  onEdit,
  onDelete,
  onAddChild,
}) {
  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <p className="text-sm text-[color:var(--admin-text-faint)]">항목을 선택하세요</p>
      </div>
    )
  }

  const hasChildren = Array.isArray(selectedNode.children) && selectedNode.children.length > 0

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

  const rows = [
    ['이름', selectedNode.name],
    ['부모', parentName || '최상위'],
    ['게시물',
      <Badge key="post" variant={selectedNode.postCount > 0 ? 'default' : 'secondary'} className="text-xs">
        {selectedNode.postCount ?? 0}개
      </Badge>
    ],
    hasChildren && ['하위 카테고리', `${selectedNode.children.length}개`],
  ]

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        {hasChildren
          ? <Folder className="h-4 w-4 text-sky-700"/>
          : <FolderTree className="h-4 w-4 text-sky-700"/>
        }
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">
          카테고리 상세
        </span>
        <Badge variant="default" className="text-xs">
          {selectedNode.name}
        </Badge>
      </div>
      <Separator/>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-auto p-2">
        {renderTable(rows)}
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
          <Plus className="h-3.5 w-3.5 mr-1"/>하위 카테고리 추가
        </Button>
      </div>
    </div>
  )
}
