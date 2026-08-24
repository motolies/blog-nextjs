import { Button, ContentDialog, Spinner, showToast, useConfirm } from '@hvy/ui';
import { Plus, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TreeSearchBar from '@/components/common/tree/TreeSearchBar';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useTreeSearch } from '@/hooks/useTreeSearch';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import MasterCodeTree from './MasterCodeTree';
import NodeDetailPanel from './NodeDetailPanel';
import NodeForm from './NodeForm';

interface AttributeSchemaItem {
  key: string;
  label: string;
  type: string;
  // 'true'이면 공개(비관리자) 응답에서 백엔드가 이 속성을 제거한다. 없으면 false(공개)로 간주.
  sensitive?: string;
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
  [key: string]: unknown;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  sort: number;
  isActive: boolean;
  isRoot: boolean;
  parentId: number | null;
  attributeSchema: AttributeSchemaItem[];
  attributes: Record<string, string>;
}

type DialogMode = 'addRoot' | 'addChild' | 'edit';

const INITIAL_FORM_DATA: FormData = {
  code: '',
  name: '',
  description: '',
  sort: 0,
  isActive: true,
  isRoot: false,
  parentId: null,
  attributeSchema: [],
  attributes: {},
};

// useTreeSearch 에 넘기는 추출자 — 모듈 스코프에 둬야 참조가 고정돼 필터가 매 렌더 다시 돌지 않는다.
const getMasterCodeRowId = (node: MasterCodeNode) => String(node.id);
const masterCodeSearchFields = (node: MasterCodeNode) => [node.code, node.name];

export default function MasterCodePage() {
  const askConfirm = useConfirm();
  // 데이터 상태
  const [treeData, setTreeData] = useState<MasterCodeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 선택/탐색 상태
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [originalCode, setOriginalCode] = useState<string>('');
  const [dialogParentNode, setDialogParentNode] = useState<MasterCodeNode | null>(null);

  // 트리 검색 — 검색어와 펼침 상태를 함께 소유한다.
  // 아래 파생값들은 **원본** treeData 를 봐야 한다. 필터된 클론을 넣으면 자식이 잘린 노드가
  // 흘러들어 삭제 가드(하위 노드 존재 확인)와 상세 패널의 하위 개수가 조용히 틀어진다.
  const search = useTreeSearch(treeData, getMasterCodeRowId, masterCodeSearchFields);

  // 선택된 노드 객체 찾기 (트리에서 재귀 탐색)
  const selectedNode = useMemo(() => {
    if (selectedNodeId == null) return null;
    return findNodeById(treeData, selectedNodeId);
  }, [treeData, selectedNodeId]);

  // 선택된 노드의 루트 조상의 attributeSchema (자식 노드 편집 시 필요)
  const rootAttributeSchema = useMemo(() => {
    if (!selectedNode) return [] as AttributeSchemaItem[];
    const root = findRootAncestor(treeData, selectedNodeId!);
    return root?.attributeSchema || [];
  }, [treeData, selectedNode, selectedNodeId]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await service.masterCode.getTree();
      setTreeData(data || []);
    } catch (error: any) {
      showApiErrorToast(
        `데이터 로드 실패: ${error.response?.data?.message || error.message}`,
        error,
      );
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 노드 선택
  const handleNodeSelect = useCallback((node: MasterCodeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  // 루트 노드 추가
  const handleAddRoot = useCallback(() => {
    setDialogMode('addRoot');
    setDialogParentNode(null);
    setFormData({ ...INITIAL_FORM_DATA, isRoot: true, attributeSchema: [] });
    setOriginalCode('');
    setOpenDialog(true);
  }, []);

  // 하위 노드 추가
  const handleAddChild = useCallback(
    (parentNode: MasterCodeNode) => {
      const rootAncestor = findRootAncestor(treeData, parentNode.id);
      setDialogMode('addChild');
      setDialogParentNode(parentNode);
      setFormData({
        ...INITIAL_FORM_DATA,
        parentId: parentNode.id,
        attributes: {},
      });
      setOriginalCode('');
      setOpenDialog(true);
    },
    [treeData],
  );

  // 편집
  const handleEdit = useCallback((node: MasterCodeNode) => {
    const isRoot = node.depth === 0;
    setDialogMode('edit');
    setDialogParentNode(null);
    setFormData({
      code: node.code,
      name: node.name,
      description: node.description || '',
      sort: node.sort ?? 0,
      isActive: node.isActive,
      isRoot,
      parentId: node.parentId ?? null,
      attributeSchema: isRoot ? node.attributeSchema || [] : [],
      attributes: !isRoot ? node.attributes || {} : {},
    });
    setOriginalCode(node.code);
    setOpenDialog(true);
  }, []);

  // 삭제 요청 — 확인 다이얼로그를 띄운다
  const handleDelete = useCallback(
    async (node: MasterCodeNode) => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      if (hasChildren) {
        showToast(
          '하위 노드가 존재하여 삭제할 수 없습니다. 하위 노드를 먼저 삭제해주세요.',
          'error',
        );
        return;
      }
      const ok = await askConfirm({
        message: `"${node.name}" (${node.code})을(를) 삭제하시겠습니까?`,
        confirmLabel: '삭제',
        destructive: true,
      });
      if (!ok) return;
      try {
        setLoading(true);
        await service.masterCode.deleteNode(node.id);
        showToast('노드가 성공적으로 삭제되었습니다.');
        if (selectedNodeId === node.id) {
          setSelectedNodeId(null);
        }
        await loadData();
      } catch (error: any) {
        showApiErrorToast(`삭제 실패: ${error.response?.data?.message || error.message}`, error);
      } finally {
        setLoading(false);
      }
    },
    [askConfirm, loadData, selectedNodeId],
  );

  // 저장
  const handleSave = async () => {
    if (!formData.code?.trim()) {
      showToast('코드는 필수 입력입니다.', 'error');
      return;
    }
    if (!formData.name?.trim()) {
      showToast('이름은 필수 입력입니다.', 'error');
      return;
    }

    try {
      setLoading(true);

      // 저장 시 모든 스키마 항목에 sensitive를 'true'/'false'로 명시한다(읽기는 기본 false, 저장 시 명시).
      const normalizedSchema = (formData.attributeSchema || []).map((it: AttributeSchemaItem) => ({
        key: it.key,
        label: it.label,
        type: it.type,
        sensitive: it.sensitive === 'true' ? 'true' : 'false',
      }));

      if (dialogMode === 'addRoot') {
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          parentId: null,
          attributeSchema: normalizedSchema,
        };
        await service.masterCode.createNode(payload);
        showToast('루트 노드가 성공적으로 생성되었습니다.');
      } else if (dialogMode === 'addChild') {
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          parentId: formData.parentId,
          attributes: formData.attributes,
        };
        await service.masterCode.createNode(payload);
        showToast('하위 노드가 성공적으로 생성되었습니다.');
        // 부모 노드 펼침
        if (formData.parentId != null) {
          search.expandNode(String(formData.parentId));
        }
      } else if (dialogMode === 'edit') {
        const isRoot = formData.isRoot;
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          ...(isRoot ? { attributeSchema: normalizedSchema } : { attributes: formData.attributes }),
        };
        await service.masterCode.updateNode(selectedNode!.id, payload);
        showToast('노드가 성공적으로 수정되었습니다.');
      }

      // 방금 만든 노드가 검색어와 맞지 않으면 화면에 나타나지 않는다 — 생성일 때만 필터를 푼다.
      // 편집·삭제는 대상 행이 이미 보이던 행이라 이 문제가 없다.
      if (dialogMode !== 'edit') search.clearQuery();

      setOpenDialog(false);
      await loadData();
    } catch (error: any) {
      showApiErrorToast(`저장 실패: ${error.response?.data?.message || error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  // 확인 후 전체 캐시 삭제 수행
  const handleClearAllCache = async () => {
    const ok = await askConfirm({
      message:
        '전체 캐시를 삭제하시겠습니까? 모든 캐시가 삭제되며 시스템 성능에 일시적인 영향을 줄 수 있습니다.',
      confirmLabel: '삭제',
    });
    if (!ok) return;
    try {
      setLoading(true);
      const result = await service.masterCode.evictAllCaches();
      showToast(`${result.message} (${result.evictedCacheCount}개 캐시 삭제됨)`);
    } catch (error: any) {
      showApiErrorToast(`캐시 삭제 실패: ${error.response?.data?.message || error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  // 편집 다이얼로그에서 자식 노드의 루트 schema 결정
  const formRootAttributeSchema = useMemo(() => {
    if (dialogMode === 'addChild' && dialogParentNode) {
      const root = findRootAncestor(treeData, dialogParentNode.id);
      return root?.attributeSchema || [];
    }
    if (dialogMode === 'edit' && selectedNode && !formData.isRoot) {
      const root = findRootAncestor(treeData, selectedNode.id);
      return root?.attributeSchema || [];
    }
    return [] as AttributeSchemaItem[];
  }, [dialogMode, dialogParentNode, selectedNode, treeData, formData.isRoot]);

  const dialogTitle =
    {
      addRoot: '루트 노드 추가',
      addChild: '하위 노드 추가',
      edit: '노드 편집',
    }[dialogMode as string] || '';

  return (
    <AdminPageFrame
      className="admin-page-frame--fixed"
      actions={
        <>
          <Button variant="primary" onClick={handleAddRoot} busy={loading}>
            <Plus className="h-4 w-4 mr-1" />
            루트 추가
          </Button>
          <Button
            variant="outline-gray"
            className="border-dl-warning text-dl-warning-ink hover:bg-dl-warning-bg"
            onClick={handleClearAllCache}
            busy={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            캐시 삭제
          </Button>
        </>
      }
    >
      {/* 검색 바 — 로딩 삼항 밖에 둔다. 안에 넣으면 로딩이 끝나는 순간 검색바가 튀어 들어온다. */}
      <TreeSearchBar
        value={search.query}
        onChange={search.setQuery}
        onClear={search.clearQuery}
        placeholder="코드 또는 이름으로 검색..."
        label="마스터코드 검색"
        resultCount={search.isSearching ? search.matchCount : null}
      />

      {/* 메인 콘텐츠 */}
      {loading && treeData.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="admin-split-layout admin-fill" data-size="wide">
          {/* 좌측: 트리 뷰 */}
          <div className="admin-panel admin-fill min-w-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-2">
              <MasterCodeTree
                treeData={search.nodes}
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelect}
                expanded={search.expanded}
                onToggle={search.toggle}
                query={search.query}
                isSearching={search.isSearching}
              />
            </div>
          </div>

          {/* 우측: 상세 패널 */}
          <div className="admin-panel admin-fill overflow-hidden">
            <NodeDetailPanel
              selectedNode={selectedNode}
              rootAttributeSchema={rootAttributeSchema}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      )}

      {/* 추가/편집 다이얼로그 */}
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogTitle}
        size="lg"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenDialog(false)} busy={loading}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} busy={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {loading ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      >
        <NodeForm
          formData={formData}
          setFormData={setFormData}
          dialogMode={dialogMode}
          originalCode={originalCode}
          parentNode={dialogParentNode}
          rootAttributeSchema={formRootAttributeSchema}
        />
      </ContentDialog>
    </AdminPageFrame>
  );
}

// --- 유틸리티 함수 ---

/**
 * 트리에서 ID로 노드 찾기 (재귀)
 */
function findNodeById(nodes: MasterCodeNode[], id: number): MasterCodeNode | null {
  if (!nodes) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 노드의 루트 조상(depth=0) 찾기
 * 트리를 순회하며 해당 노드를 포함하는 루트 노드를 반환
 */
function findRootAncestor(treeData: MasterCodeNode[], targetId: number): MasterCodeNode | null {
  if (!treeData) return null;
  for (const root of treeData) {
    if (containsNode(root, targetId)) return root;
  }
  return null;
}

/**
 * 노드 서브트리에 대상 ID가 포함되어 있는지 확인
 */
function containsNode(node: MasterCodeNode, targetId: number): boolean {
  if (node.id === targetId) return true;
  if (node.children) {
    return node.children.some((child) => containsNode(child, targetId));
  }
  return false;
}
