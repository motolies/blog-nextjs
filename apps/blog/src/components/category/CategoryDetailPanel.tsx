import { Badge, Button, EmptyState, FieldValue, FormGrid, Icon } from '@hvy/ui';
import { Folder, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';

interface CategoryNode {
  id: string;
  name: string;
  postCount?: number;
  children?: CategoryNode[];
}

interface CategoryDetailPanelProps {
  selectedNode: CategoryNode | null;
  parentName?: string;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: CategoryNode) => void;
  onAddChild: (node: CategoryNode) => void;
}

export default function CategoryDetailPanel({
  selectedNode,
  parentName,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryDetailPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center admin-panel-soft">
        <EmptyState message="항목을 선택하세요" />
      </div>
    );
  }

  const hasChildren = Array.isArray(selectedNode.children) && selectedNode.children.length > 0;

  // 라벨·값 쌍은 표가 아니라 상세 폼이다 — FormGrid + FieldValue 계약을 따른다.
  const renderDetails = (rows: ([string, React.ReactNode] | false | null | undefined)[]) => (
    <FormGrid>
      {(rows.filter(Boolean) as [string, React.ReactNode][]).map(([label, value]) => (
        <FieldValue key={label} label={label} size="sm">
          {value}
        </FieldValue>
      ))}
    </FormGrid>
  );

  const rows: ([string, React.ReactNode] | false | null | undefined)[] = [
    ['이름', selectedNode.name],
    ['부모', parentName || '최상위'],
    [
      '게시물',
      <Badge key="post" tone={selectedNode.postCount! > 0 ? 'primary' : 'neutral'}>
        {selectedNode.postCount ?? 0}개
      </Badge>,
    ],
    hasChildren && ['하위 카테고리', `${selectedNode.children!.length}개`],
  ];

  return (
    <div className="flex h-full flex-col admin-panel-soft">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        {hasChildren ? (
          <Icon icon={Folder} className="text-dl-primary-ink" />
        ) : (
          <Icon icon={FolderTree} className="text-dl-primary-ink" />
        )}
        <span className="flex-1 text-dl-sm font-semibold text-[color:var(--admin-text)]">
          카테고리 상세
        </span>
        <Badge tone="primary">{selectedNode.name}</Badge>
      </div>
      <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

      {/* 상세 정보 */}
      <div className="flex-1 overflow-auto p-2">{renderDetails(rows)}</div>

      {/* 액션 버튼 */}
      <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />
      <div className="flex flex-wrap gap-1.5 p-3">
        <Button size="sm" variant="outline-gray" onClick={() => onEdit(selectedNode)} icon={Pencil}>
          편집
        </Button>
        <Button
          size="sm"
          variant="outline-red"
          onClick={() => onDelete(selectedNode)}
          icon={Trash2}
        >
          삭제
        </Button>
        <Button
          size="sm"
          variant="outline-gray"
          onClick={() => onAddChild(selectedNode)}
          icon={Plus}
        >
          하위 카테고리 추가
        </Button>
      </div>
    </div>
  );
}
