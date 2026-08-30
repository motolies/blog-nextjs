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
  /**
   * 형제 순서 변경. 새 순서대로 나열한 **자식 id 배열**을 올려보낸다(노드 객체가 아니라 id 인 이유:
   * 백엔드 API 가 받는 모양 그대로여서 페이지가 변환할 일이 없다).
   *
   * ⚠️ **검색 중에는 자동으로 꺼진다.** 이 컴포넌트가 받는 `treeData` 는 필터 결과라, 검색 중에
   * 순서를 바꾸면 화면에 남은 형제만 전송된다. 백엔드는 요청에 없는 형제를 뒤에 이어붙이므로
   * **걸러져 보이지 않던 형제가 전부 맨 뒤로 밀린다** — 사용자는 그 사실을 볼 수조차 없다.
   */
  onReorder?: (parentId: string, orderedIds: readonly string[]) => void;
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
  onReorder,
}: MasterCodeTreeProps) {
  return (
    <TreeGrid<MasterCodeTreeNode>
      nodes={treeData}
      getRowId={(node) => String(node.id)}
      expanded={expanded}
      onToggle={onToggle}
      onReorder={
        isSearching || !onReorder
          ? undefined
          : (parentId, next) => onReorder(parentId, next.map((node) => String(node.id)))
      }
      reorderLabel={(node) => `${node.code} 순서 변경`}
      reorderAnnouncement={(node, position, total) =>
        `${node.code}, ${position}번째로 이동(전체 ${total}개)`
      }
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
