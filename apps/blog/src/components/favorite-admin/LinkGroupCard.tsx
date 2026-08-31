'use client';

import { Badge, Button, Icon, IconButton } from '@hvy/ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import SortableRowList from '@/components/common/reorder/SortableRowList';
import { resolveLinkIcon } from '@/lib/linkIcons';
import type { AdminLinkGroup, AdminLinkItem } from '@/types/linkTree';

/**
 * 관리 화면의 그룹 카드 — 헤더(그룹 조작)와 링크 행 목록.
 *
 * 링크 순서는 손잡이 드래그(또는 손잡이 포커스 후 ↑↓)로 바꾼다. 위/아래 버튼을 두지 않는 이유는
 * `useListReorder` 가 키보드 이동과 스크린리더 안내를 이미 제공하기 때문이다 — 버튼을 남기면
 * 기능이 두 벌이 되고 행마다 탭 스톱이 넷으로 늘어 키보드 탐색이 오히려 나빠진다.
 *
 * **그룹 순서는 여기서 바꾸지 않는다** — 마스터코드 화면(1열 트리)이 담당한다.
 * 이 화면의 그룹은 2열 그리드라 단일 축 전제인 재정렬 훅과 애초에 맞지 않기도 하다.
 */
export default function LinkGroupCard({
  group,
  onEditGroup,
  onDeleteGroup,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onReorderLinks,
  busy,
}: {
  readonly group: AdminLinkGroup;
  readonly onEditGroup: (group: AdminLinkGroup) => void;
  readonly onDeleteGroup: (group: AdminLinkGroup) => void;
  readonly onAddLink: (group: AdminLinkGroup) => void;
  readonly onEditLink: (group: AdminLinkGroup, link: AdminLinkItem) => void;
  readonly onDeleteLink: (group: AdminLinkGroup, link: AdminLinkItem) => void;
  readonly onReorderLinks: (group: AdminLinkGroup, next: readonly AdminLinkItem[]) => void;
  /** CRUD(저장·삭제·재조회) 진행 중. ⚠️ 드래그 손잡이는 이걸로 잠그지 않는다. */
  readonly busy: boolean;
}) {
  const GroupIcon = resolveLinkIcon(group.icon);
  // 백엔드가 자식 있는 노드의 삭제를 거부하고(400 + Slack), 그 예외는 평범한 실수로도 난다.
  // 여기서 미리 막는 것이 그 알림을 막는 유일한 방법이다.
  const hasLinks = group.links.length > 0;

  return (
    <section className="admin-panel admin-panel-pad flex flex-col gap-4">
      <header className="flex items-start gap-3">
        {GroupIcon && <Icon icon={GroupIcon} size="md" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-dl-lg font-semibold text-dl-fg">{group.name}</h3>
            {!group.isActive && (
              <Badge tone="neutral" size="xs">
                비활성
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="truncate text-dl-sm text-dl-fg-muted">{group.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            icon={Pencil}
            label="그룹 수정"
            title="수정"
            disabled={busy}
            onClick={() => onEditGroup(group)}
          />
          <IconButton
            icon={Trash2}
            label="그룹 삭제"
            title={hasLinks ? '하위 링크를 먼저 삭제하세요' : '삭제'}
            disabled={hasLinks || busy}
            onClick={() => onDeleteGroup(group)}
          />
        </div>
      </header>

      <SortableRowList<AdminLinkItem>
        items={group.links}
        onReorder={(next) => onReorderLinks(group, next)}
        getLabel={(link) => link.name}
        emptyText="등록된 링크가 없습니다."
        rowClassName="admin-link-card rounded-dl-control border px-3 py-2"
        renderRow={(link) => {
          const LinkIcon = resolveLinkIcon(link.icon);
          return (
            <>
              {LinkIcon && <Icon icon={LinkIcon} size="sm" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-dl-sm font-medium text-dl-fg">{link.name}</span>
                  {!link.isActive && (
                    <Badge tone="neutral" size="xs">
                      비활성
                    </Badge>
                  )}
                  {!link.url && (
                    <Badge tone="warning" size="xs">
                      URL 없음
                    </Badge>
                  )}
                </div>
                <span className="block truncate text-dl-xs text-dl-fg-muted">
                  {link.url || '—'}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {/* 아이콘 전용이라 IconButton — children 없는 Button 은 좌우 패딩 20+20 을
                    먹어 56×42 가 되고, 375px 에서 이름·URL 칸을 100px 로 짓눌렀다. */}
                <IconButton
                  icon={Pencil}
                  label="링크 수정"
                  title="수정"
                  disabled={busy}
                  onClick={() => onEditLink(group, link)}
                />
                <IconButton
                  icon={Trash2}
                  label="링크 삭제"
                  title="삭제"
                  disabled={busy}
                  onClick={() => onDeleteLink(group, link)}
                />
              </div>
            </>
          );
        }}
      />

      <Button variant="outline-gray" icon={Plus} disabled={busy} onClick={() => onAddLink(group)}>
        링크 추가
      </Button>
    </section>
  );
}
