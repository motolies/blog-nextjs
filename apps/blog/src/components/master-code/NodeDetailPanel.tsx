import { Badge, Button, EmptyState, FieldValue, FormGrid } from '@hvy/ui';
import { Code, Folder, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';

interface AttributeSchemaItem {
  key: string;
  label: string;
  type: string;
}

interface MasterCodeNode {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort?: number;
  isActive: boolean;
  depth: number;
  parentId?: number | null;
  children?: MasterCodeNode[];
  attributeSchema?: AttributeSchemaItem[];
  attributes?: Record<string, string>;
}

interface NodeDetailPanelProps {
  selectedNode: MasterCodeNode | null;
  rootAttributeSchema?: AttributeSchemaItem[];
  onEdit: (node: MasterCodeNode) => void;
  onDelete: (node: MasterCodeNode) => void;
  onAddChild: (node: MasterCodeNode) => void;
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
        <EmptyState message="항목을 선택하세요" />
      </div>
    );
  }

  const isRoot = selectedNode.depth === 0;

  // 라벨·값 쌍은 표가 아니라 상세 폼이다 — FormGrid + FieldValue 계약을 따른다.
  // 구 구현의 `__separator` 센티널 행은 섹션을 FormGrid 두 벌로 나누어 대체했다.
  const renderDetails = (rows: ([string, React.ReactNode] | false | null | undefined)[]) => (
    <FormGrid>
      {(rows.filter(Boolean) as [string, React.ReactNode][]).map(([label, value]) => (
        <FieldValue key={label} label={label} size="sm">
          {value}
        </FieldValue>
      ))}
    </FormGrid>
  );

  // 기본 정보 행
  const baseRows: [string, React.ReactNode][] = [
    ['코드', selectedNode.code],
    ['이름', selectedNode.name],
    ['설명', selectedNode.description || '-'],
    ['정렬순서', selectedNode.sort ?? 0],
    [
      '상태',
      <Badge key="status" tone={selectedNode.isActive ? 'success' : 'neutral'} className="text-xs">
        {selectedNode.isActive ? '활성' : '비활성'}
      </Badge>,
    ],
  ];

  // 루트 노드: attributeSchema 표시
  const schemaRows: [string, React.ReactNode][] =
    isRoot && Array.isArray(selectedNode.attributeSchema) && selectedNode.attributeSchema.length > 0
      ? selectedNode.attributeSchema.map((s, idx) => [
          `속성${idx + 1}`,
          <span key={idx}>
            <code className="rounded bg-dl-option-hover px-1 py-0.5 text-xs font-mono">
              {s.key}
            </code>
            <span className="ml-1.5 text-dl-fg-muted">{s.label}</span>
            <Badge tone="neutral" className="ml-1.5 text-[10px]">
              {s.type}
            </Badge>
          </span>,
        ])
      : [];

  // 자식 노드: attributes 값 표시 (rootAttributeSchema의 label 활용)
  const attrRows: [string, React.ReactNode][] =
    !isRoot && selectedNode.attributes && typeof selectedNode.attributes === 'object'
      ? Object.entries(selectedNode.attributes)
          .filter(([, v]) => v != null && v !== '')
          .map(([key, value]) => {
            const schemaDef = rootAttributeSchema?.find((s) => s.key === key);
            return [schemaDef?.label || key, String(value)];
          })
      : [];

  // 자식 수 (있는 경우)
  const childCountRow: [string, React.ReactNode][] =
    Array.isArray(selectedNode.children) && selectedNode.children.length > 0
      ? [['하위 노드', `${selectedNode.children.length}개`]]
      : [];

  const infoRows: ([string, React.ReactNode] | false | null | undefined)[] = [
    ...baseRows,
    ...childCountRow,
    ...schemaRows,
  ];

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        {isRoot ? (
          <Folder className="h-4 w-4 text-dl-primary-ink" />
        ) : (
          <Code className="h-4 w-4 text-dl-fg-muted" />
        )}
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">
          {isRoot ? '루트 노드' : '노드'} 상세
        </span>
        <Badge tone={isRoot ? 'primary' : 'neutral'} className="text-xs">
          {selectedNode.code}
        </Badge>
      </div>
      <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

      {/* 상세 정보 */}
      <div className="flex-1 space-y-4 overflow-auto p-2">
        {renderDetails(infoRows)}
        {attrRows.length > 0 ? (
          <section className="space-y-1.5">
            <h3 className="text-dl-sm font-semibold text-dl-fg">속성값</h3>
            {renderDetails(attrRows)}
          </section>
        ) : null}
      </div>

      {/* 액션 버튼 */}
      <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />
      <div className="flex flex-wrap gap-1.5 p-3">
        <Button size="sm" variant="outline-gray" onClick={() => onEdit(selectedNode)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          편집
        </Button>
        <Button size="sm" variant="outline-red" onClick={() => onDelete(selectedNode)}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          삭제
        </Button>
        <Button size="sm" variant="outline-gray" onClick={() => onAddChild(selectedNode)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          하위 노드 추가
        </Button>
      </div>
    </div>
  );
}
