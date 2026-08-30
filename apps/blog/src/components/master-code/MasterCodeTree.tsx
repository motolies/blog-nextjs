import { Badge, cn, TreeGrid } from '@hvy/ui';
import { Code, Folder, FolderOpen, FolderTree, Search } from 'lucide-react';
import HighlightedText from '@/components/common/tree/HighlightedText';

interface MasterCodeTreeNode {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  children?: MasterCodeTreeNode[];
  [key: string]: unknown;
}

interface MasterCodeTreeProps {
  /** 이미 필터링된 노드들. 검색 중이 아니면 원본 그대로다. */
  treeData: readonly MasterCodeTreeNode[];
  selectedNodeId: string | null;
  onNodeSelect: (node: MasterCodeTreeNode) => void;
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** 검색어 — 행 안의 일치 글자를 강조하는 데 쓴다. */
  query: string;
  isSearching: boolean;
}

/** 마스터코드 트리 — @hvy/ui TreeGrid 배선. 행 내용(아이콘·코드·이름·비활성 배지)만 앱이 그린다. */
export default function MasterCodeTree({
  treeData,
  selectedNodeId,
  onNodeSelect,
  expanded,
  onToggle,
  query,
  isSearching,
}: MasterCodeTreeProps) {
  return (
    <TreeGrid<MasterCodeTreeNode>
      nodes={treeData}
      getRowId={(node) => String(node.id)}
      expanded={expanded}
      onToggle={onToggle}
      empty={
        // 0건은 "데이터가 없다" 와 다른 사실이다 — 검색 중에는 탈출구를 함께 준다.
        isSearching
          ? {
              title: '검색 결과가 없습니다',
              icon: Search,
              hint: `'${query}' 와 일치하는 항목이 없습니다.`,
            }
          : { title: '데이터가 없습니다' }
      }
      renderRow={(node, depth) => {
        const isRoot = depth === 0;
        const isSelected = selectedNodeId != null && selectedNodeId === node.id;
        const hasChildren = (node.children?.length ?? 0) > 0;
        const RowIcon = isRoot
          ? expanded.has(String(node.id))
            ? FolderOpen
            : Folder
          : hasChildren
            ? FolderTree
            : Code;
        return (
          <button
            type="button"
            onClick={() => onNodeSelect(node)}
            className={cn(
              'flex w-full items-center gap-2 rounded px-1 py-0.5 text-left',
              isSelected && 'bg-dl-tonal ring-1 ring-dl-primary',
            )}
          >
            <RowIcon
              className={cn(
                'size-dl-ic-sm shrink-0',
                isRoot ? 'text-dl-primary-ink' : 'text-dl-fg-muted',
              )}
            />
            {/* 코드와 이름은 검색 대상이 서로 다른 필드라 각각 강조한다 — 괄호는 장식이라 제외한다. */}
            <span className="flex-1 truncate text-dl-sm">
              <span
                className={cn(
                  'font-medium',
                  isSelected ? 'text-dl-primary-ink' : 'text-[color:var(--admin-text)]',
                )}
              >
                <HighlightedText text={node.code} query={query} />
              </span>
              <span className="ml-1.5 text-[color:var(--admin-text-faint)]">
                (<HighlightedText text={node.name} query={query} />)
              </span>
            </span>
            {!node.isActive && (
              <Badge tone="neutral" className="shrink-0">
                비활성
              </Badge>
            )}
          </button>
        );
      }}
    />
  );
}
