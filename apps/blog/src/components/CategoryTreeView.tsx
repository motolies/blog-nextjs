import { Badge, cn, TreeGrid } from '@hvy/ui';
import { Folder, FolderOpen, FolderTree, Search } from 'lucide-react';
import HighlightedText from '@/components/common/tree/HighlightedText';

export interface CategoryTreeNodeView {
  id: string;
  name: string;
  postCount?: number;
  children?: CategoryTreeNodeView[];
  [key: string]: unknown;
}

interface CategoryTreeViewProps {
  /** 이미 필터링된 노드들. 검색 중이 아니면 원본 그대로다. */
  nodes: readonly CategoryTreeNodeView[];
  selectedNodeId?: string | null;
  /**
   * **id 만** 올려보낸다. 필터가 만든 클론이 트리 밖으로 나가 선택으로 저장되면
   * 상세 패널의 "하위 카테고리 N개" 가 잘린 자식 수를 보여준다.
   */
  onSelectNode: (id: string) => void;
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** 검색어 — 행 안의 일치 글자를 강조하는 데 쓴다. */
  query: string;
  isSearching: boolean;
}

/** TreeGrid 의 getRowId 와 useTreeSearch 의 getId 가 공유하는 단 하나의 정의. */
export const getCategoryRowId = (node: CategoryTreeNodeView) => node.id;
/** 카테고리 검색 대상은 이름뿐이다(마스터코드는 코드까지 본다). */
export const categorySearchFields = (node: CategoryTreeNodeView) => [node.name];

/** 카테고리 트리 — @hvy/ui TreeGrid 배선. 데이터·펼침·검색은 전부 페이지가 소유한다. */
export default function CategoryTreeView({
  nodes,
  selectedNodeId,
  onSelectNode,
  expanded,
  onToggle,
  query,
  isSearching,
}: CategoryTreeViewProps) {
  return (
    <TreeGrid<CategoryTreeNodeView>
      nodes={nodes}
      getRowId={getCategoryRowId}
      expanded={expanded}
      onToggle={onToggle}
      empty={
        // 카테고리는 단일 루트라 검색에서 루트가 통째로 탈락하는 경로가 정상이다.
        isSearching
          ? {
              title: '검색 결과가 없습니다',
              icon: Search,
              hint: `'${query}' 와 일치하는 카테고리가 없습니다.`,
            }
          : { title: '카테고리가 없습니다' }
      }
      renderRow={(node) => {
        const isSelected = selectedNodeId != null && selectedNodeId === node.id;
        const hasChildren = (node.children?.length ?? 0) > 0;
        const RowIcon = hasChildren ? (expanded.has(node.id) ? FolderOpen : Folder) : FolderTree;
        return (
          <button
            type="button"
            onClick={() => onSelectNode(node.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded px-1 py-0.5 text-left',
              isSelected && 'bg-dl-tonal ring-1 ring-dl-primary',
            )}
          >
            <RowIcon className="h-4 w-4 text-dl-primary shrink-0" />
            <span className="flex-1 truncate text-sm font-medium text-[color:var(--admin-text)]">
              <HighlightedText text={node.name} query={query} />
            </span>
            {(node.postCount ?? 0) > 0 && (
              <Badge className="text-xs h-5 px-1.5 shrink-0">{node.postCount}</Badge>
            )}
          </button>
        );
      }}
    />
  );
}
