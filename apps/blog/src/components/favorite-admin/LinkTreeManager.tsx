'use client';

import { Button, ContentDialog, Spinner, showToast, useConfirm } from '@hvy/ui';
import { Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { buildNodeCode, renumberSiblings } from '@/lib/linkTree';
import service from '@/service';
import type { AdminLinkGroup, AdminLinkItem, AdminLinkTree, LinkRootKey } from '@/types/linkTree';
import LinkGroupCard from './LinkGroupCard';
import LinkNodeForm, { EMPTY_FORM, type LinkNodeFormData } from './LinkNodeForm';

type DialogState =
  | { mode: 'addGroup' }
  | { mode: 'editGroup'; group: AdminLinkGroup }
  | { mode: 'addLink'; group: AdminLinkGroup }
  | { mode: 'editLink'; group: AdminLinkGroup; link: AdminLinkItem };

/**
 * 한 루트(FAVORITE 또는 PLATFORM)의 그룹/링크를 관리한다. 탭 두 개가 이 컴포넌트를
 * 루트 코드만 바꿔 각각 렌더한다 — 두 트리는 구조도 스키마 키도 같아서 UI 가 완전히 같다.
 *
 * 저장 후에는 전체를 재조회한다(낙관적 업데이트 없음). MasterCodePage 와 같은 규약이고,
 * 정렬 변경처럼 여러 건을 연달아 PUT 하는 경우 중간 실패 시 화면이 실제 상태와 어긋나는 것을 막는다.
 */
export default function LinkTreeManager({ rootCode }: { readonly rootCode: LinkRootKey }) {
  const [tree, setTree] = useState<AdminLinkTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [form, setForm] = useState<LinkNodeFormData>(EMPTY_FORM);
  const askConfirm = useConfirm();

  const isPublicRoot = rootCode === 'FAVORITE';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setTree(await service.linkTree.getAdminTree(rootCode));
    } catch (error) {
      showApiErrorToast('목록을 불러오지 못했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, [rootCode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // --- 다이얼로그 열기 -------------------------------------------------------

  const openAddGroup = () => {
    setForm(EMPTY_FORM);
    setDialog({ mode: 'addGroup' });
  };

  const openEditGroup = (group: AdminLinkGroup) => {
    setForm({
      name: group.name,
      url: '',
      icon: group.icon,
      description: group.description,
      isActive: group.isActive,
    });
    setDialog({ mode: 'editGroup', group });
  };

  const openAddLink = (group: AdminLinkGroup) => {
    setForm(EMPTY_FORM);
    setDialog({ mode: 'addLink', group });
  };

  const openEditLink = (group: AdminLinkGroup, link: AdminLinkItem) => {
    setForm({
      name: link.name,
      url: link.url,
      icon: link.icon,
      description: '',
      isActive: link.isActive,
    });
    setDialog({ mode: 'editLink', group, link });
  };

  // --- 저장 -----------------------------------------------------------------

  const handleSave = async () => {
    if (!dialog || !tree) return;

    const name = form.name.trim();
    if (!name) {
      showToast('이름은 필수 입력입니다.', 'error');
      return;
    }
    const isLink = dialog.mode === 'addLink' || dialog.mode === 'editLink';
    const url = form.url.trim();
    if (isLink && !url) {
      showToast('URL 은 필수 입력입니다.', 'error');
      return;
    }

    try {
      setLoading(true);

      if (dialog.mode === 'addGroup') {
        await service.linkTree.createNode({
          parentId: tree.rootId,
          code: buildNodeCode(
            name,
            tree.groups.map((g) => g.code),
          ),
          name,
          description: form.description.trim() || null,
          isActive: form.isActive,
          sort: tree.groups.length + 1,
          attributes: { icon: form.icon },
        });
      } else if (dialog.mode === 'editGroup') {
        await service.linkTree.updateNode(dialog.group.id, {
          name,
          description: form.description.trim() || null,
          isActive: form.isActive,
          attributes: { icon: form.icon },
        });
      } else if (dialog.mode === 'addLink') {
        await service.linkTree.createNode({
          parentId: dialog.group.id,
          code: buildNodeCode(
            name,
            dialog.group.links.map((l) => l.code),
          ),
          name,
          isActive: form.isActive,
          sort: dialog.group.links.length + 1,
          // attributes 는 통째로 교체된다 — url 과 icon 을 항상 함께 보낸다.
          attributes: { url, icon: form.icon },
        });
      } else {
        await service.linkTree.updateNode(dialog.link.id, {
          name,
          isActive: form.isActive,
          attributes: { url, icon: form.icon },
        });
      }

      showToast('저장되었습니다.');
      setDialog(null);
      await loadData();
    } catch (error) {
      showApiErrorToast('저장에 실패했습니다.', error);
      setLoading(false);
    }
  };

  // --- 삭제 -----------------------------------------------------------------

  const handleDeleteGroup = async (group: AdminLinkGroup) => {
    if (group.links.length > 0) {
      showToast('하위 링크를 먼저 삭제해주세요.', 'error');
      return;
    }
    const ok = await askConfirm({
      message: `"${group.name}" 그룹을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    try {
      setLoading(true);
      await service.linkTree.deleteNode(group.id);
      showToast('그룹이 삭제되었습니다.');
      await loadData();
    } catch (error) {
      showApiErrorToast('삭제에 실패했습니다.', error);
      setLoading(false);
    }
  };

  const handleDeleteLink = async (_group: AdminLinkGroup, link: AdminLinkItem) => {
    const ok = await askConfirm({
      message: `"${link.name}" 링크를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    try {
      setLoading(true);
      await service.linkTree.deleteNode(link.id);
      showToast('링크가 삭제되었습니다.');
      await loadData();
    } catch (error) {
      showApiErrorToast('삭제에 실패했습니다.', error);
      setLoading(false);
    }
  };

  // --- 순서 -----------------------------------------------------------------

  /**
   * sort 를 1..n 으로 정규화해 바뀐 것만 PUT 한다.
   * ⚠️ reorder 엔드포인트는 백엔드에 없다(404) — updateNode 로 sort 를 갱신하는 것이 정석이다.
   * 실패해도 재조회하는 이유: 중간까지 반영된 실제 순서를 화면이 그대로 보여줘야 한다.
   */
  const applyMove = async (updates: readonly { id: string; sort: number }[]) => {
    if (updates.length === 0) return;
    try {
      setLoading(true);
      await service.linkTree.applySortUpdates(updates);
    } catch (error) {
      showApiErrorToast('순서 변경에 실패했습니다.', error);
    } finally {
      await loadData();
    }
  };

  const handleMoveGroup = (group: AdminLinkGroup, direction: -1 | 1) => {
    if (!tree) return;
    const index = tree.groups.findIndex((g) => g.id === group.id);
    void applyMove(renumberSiblings(tree.groups, index, index + direction));
  };

  const handleMoveLink = (group: AdminLinkGroup, index: number, direction: -1 | 1) => {
    void applyMove(renumberSiblings(group.links, index, index + direction));
  };

  // --- 렌더 -----------------------------------------------------------------

  const dialogTitle = !dialog
    ? ''
    : dialog.mode === 'addGroup'
      ? '그룹 추가'
      : dialog.mode === 'editGroup'
        ? '그룹 수정'
        : dialog.mode === 'addLink'
          ? `링크 추가 — ${dialog.group.name}`
          : '링크 수정';

  const formKind = dialog?.mode === 'addGroup' || dialog?.mode === 'editGroup' ? 'group' : 'link';
  const existingCode =
    dialog?.mode === 'editGroup'
      ? dialog.group.code
      : dialog?.mode === 'editLink'
        ? dialog.link.code
        : undefined;

  return (
    <div className="flex flex-col gap-4 pt-4">
      {isPublicRoot && (
        <div
          className="admin-panel admin-panel-pad flex items-start gap-3 border-dl-warning"
          role="note"
        >
          <TriangleAlert className="mt-0.5 size-dl-ic-md shrink-0 text-dl-warning-ink" />
          <p className="text-dl-sm text-dl-fg">
            이 탭의 링크는 <strong>비로그인 방문자 전원에게 노출</strong>됩니다. 내부 인프라 주소는
            &quot;플랫폼&quot; 탭에 넣으세요.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button icon={Plus} disabled={loading} onClick={openAddGroup}>
          그룹 추가
        </Button>
        <Button
          variant="outline-gray"
          icon={RefreshCw}
          busy={loading}
          onClick={() => void loadData()}
        >
          새로고침
        </Button>
      </div>

      {loading && !tree ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-dl-ic-lg" />
        </div>
      ) : !tree ? (
        <p className="py-10 text-center text-dl-sm text-dl-muted">
          루트 코드 {rootCode} 를 찾지 못했습니다. 시드가 적용되었는지 확인하세요.
        </p>
      ) : tree.groups.length === 0 ? (
        <p className="py-10 text-center text-dl-sm text-dl-muted">
          등록된 그룹이 없습니다. &quot;그룹 추가&quot;로 시작하세요.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tree.groups.map((group, index) => (
            <LinkGroupCard
              key={group.id}
              group={group}
              isFirst={index === 0}
              isLast={index === tree.groups.length - 1}
              busy={loading}
              onEditGroup={openEditGroup}
              onDeleteGroup={(g) => void handleDeleteGroup(g)}
              onMoveGroup={handleMoveGroup}
              onAddLink={openAddLink}
              onEditLink={openEditLink}
              onDeleteLink={(g, l) => void handleDeleteLink(g, l)}
              onMoveLink={handleMoveLink}
            />
          ))}
        </div>
      )}

      <ContentDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialogTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              취소
            </Button>
            <Button busy={loading} onClick={() => void handleSave()}>
              저장
            </Button>
          </>
        }
      >
        <LinkNodeForm kind={formKind} data={form} existingCode={existingCode} onChange={setForm} />
      </ContentDialog>
    </div>
  );
}
