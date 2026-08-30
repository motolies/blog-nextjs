'use client';

import { Button, ContentDialog, Spinner, showToast, useConfirm } from '@hvy/ui';
import { Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { buildNodeCode } from '@/lib/linkTree';
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
 * CRUD(저장·삭제)는 전체를 재조회한다. **순서 변경만 낙관적으로 반영**한다 — 백엔드가 형제 전체를
 * 한 트랜잭션에서 재부여하므로 "중간까지만 반영된 상태"가 존재하지 않기 때문이다.
 * (형제마다 PUT 하던 시절에는 그 상태 때문에 매 변경 후 전체 재조회가 강제됐다.)
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
          // sort 를 보내지 않는다 — 관리 화면은 비활성 형제를 보지 못해 length 가 실제 형제 수와
          // 다를 수 있다. 백엔드가 findMaxSortByParentId + 1 로 맨 뒤에 붙이는 편이 정확하다.
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
          // sort 는 백엔드가 맨 뒤로 자동 부여한다(위 그룹 생성과 같은 이유).
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
   * 링크 순서를 낙관적으로 반영하고 서버에 한 번만 보낸다.
   *
   * `setLoading(true)` 를 부르지 않는 것이 요점이다 — 드래그는 놓는 즉시 결과가 보여야 하는데
   * 화면 전체를 잠그면 놓을 때마다 깜빡인다.
   *
   * 실패 시 스냅샷 롤백에서 멈추지 않고 재조회까지 하는 이유: 실패 원인 자체가 "다른 곳에서
   * 트리가 바뀜"일 수 있어(그룹이 삭제됐다든지) 되돌린 화면이 서버와 또 어긋난다.
   */
  const handleReorderLinks = async (group: AdminLinkGroup, next: readonly AdminLinkItem[]) => {
    if (!tree) return;
    const previous = tree;
    setTree({
      ...tree,
      groups: tree.groups.map((g) => (g.id === group.id ? { ...g, links: next } : g)),
    });

    try {
      await service.linkTree.reorderLinks(
        group.id,
        next.map((link) => link.id),
      );
    } catch (error) {
      showApiErrorToast('순서 변경에 실패했습니다.', error);
      setTree(previous);
      await loadData();
    }
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

      <p className="text-dl-xs text-dl-fg-muted">
        링크는 손잡이를 끌어 순서를 바꿉니다. 손잡이에 포커스를 두고 ↑↓ 키로도 이동할 수 있습니다.
      </p>

      {loading && !tree ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-dl-ic-lg" />
        </div>
      ) : !tree ? (
        <p className="py-10 text-center text-dl-sm text-dl-fg-muted">
          루트 코드 {rootCode} 를 찾지 못했습니다. 시드가 적용되었는지 확인하세요.
        </p>
      ) : tree.groups.length === 0 ? (
        <p className="py-10 text-center text-dl-sm text-dl-fg-muted">
          등록된 그룹이 없습니다. &quot;그룹 추가&quot;로 시작하세요.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tree.groups.map((group) => (
            <LinkGroupCard
              key={group.id}
              group={group}
              busy={loading}
              onEditGroup={openEditGroup}
              onDeleteGroup={(g) => void handleDeleteGroup(g)}
              onAddLink={openAddLink}
              onEditLink={openEditLink}
              onDeleteLink={(g, l) => void handleDeleteLink(g, l)}
              onReorderLinks={(g, next) => void handleReorderLinks(g, next)}
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
