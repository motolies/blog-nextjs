'use client';

import { Badge, Button, Icon } from '@hvy/ui';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { resolveLinkIcon } from '@/lib/linkIcons';
import type { AdminLinkGroup, AdminLinkItem } from '@/types/linkTree';

/** 관리 화면의 그룹 카드 — 헤더(그룹 조작)와 링크 행 목록. */
export default function LinkGroupCard({
  group,
  isFirst,
  isLast,
  onEditGroup,
  onDeleteGroup,
  onMoveGroup,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onMoveLink,
  busy,
}: {
  readonly group: AdminLinkGroup;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onEditGroup: (group: AdminLinkGroup) => void;
  readonly onDeleteGroup: (group: AdminLinkGroup) => void;
  readonly onMoveGroup: (group: AdminLinkGroup, direction: -1 | 1) => void;
  readonly onAddLink: (group: AdminLinkGroup) => void;
  readonly onEditLink: (group: AdminLinkGroup, link: AdminLinkItem) => void;
  readonly onDeleteLink: (group: AdminLinkGroup, link: AdminLinkItem) => void;
  readonly onMoveLink: (group: AdminLinkGroup, index: number, direction: -1 | 1) => void;
  readonly busy: boolean;
}) {
  const GroupIcon = resolveLinkIcon(group.icon);
  // 백엔드가 자식 있는 노드의 삭제를 거부하고(500 + Slack), 그 예외는 평범한 실수로도 난다.
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
            <p className="truncate text-dl-sm text-dl-muted">{group.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            icon={ChevronUp}
            aria-label="그룹 위로"
            title="위로"
            disabled={isFirst || busy}
            onClick={() => onMoveGroup(group, -1)}
          />
          <Button
            variant="ghost"
            icon={ChevronDown}
            aria-label="그룹 아래로"
            title="아래로"
            disabled={isLast || busy}
            onClick={() => onMoveGroup(group, 1)}
          />
          <Button
            variant="ghost"
            icon={Pencil}
            aria-label="그룹 수정"
            title="수정"
            disabled={busy}
            onClick={() => onEditGroup(group)}
          />
          <Button
            variant="ghost"
            icon={Trash2}
            aria-label="그룹 삭제"
            title={hasLinks ? '하위 링크를 먼저 삭제하세요' : '삭제'}
            disabled={hasLinks || busy}
            onClick={() => onDeleteGroup(group)}
          />
        </div>
      </header>

      <ul className="flex flex-col gap-2">
        {group.links.map((link, index) => {
          const LinkIcon = resolveLinkIcon(link.icon);
          return (
            <li
              key={link.id}
              className="admin-link-card flex items-center gap-2 rounded-dl-control border px-3 py-2"
            >
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
                <span className="block truncate text-dl-xs text-dl-muted">{link.url || '—'}</span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  icon={ChevronUp}
                  aria-label="링크 위로"
                  title="위로"
                  disabled={index === 0 || busy}
                  onClick={() => onMoveLink(group, index, -1)}
                />
                <Button
                  variant="ghost"
                  icon={ChevronDown}
                  aria-label="링크 아래로"
                  title="아래로"
                  disabled={index === group.links.length - 1 || busy}
                  onClick={() => onMoveLink(group, index, 1)}
                />
                <Button
                  variant="ghost"
                  icon={Pencil}
                  aria-label="링크 수정"
                  title="수정"
                  disabled={busy}
                  onClick={() => onEditLink(group, link)}
                />
                <Button
                  variant="ghost"
                  icon={Trash2}
                  aria-label="링크 삭제"
                  title="삭제"
                  disabled={busy}
                  onClick={() => onDeleteLink(group, link)}
                />
              </div>
            </li>
          );
        })}

        {!hasLinks && (
          <li className="py-3 text-center text-dl-sm text-dl-muted">등록된 링크가 없습니다.</li>
        )}
      </ul>

      <Button variant="outline-gray" icon={Plus} disabled={busy} onClick={() => onAddLink(group)}>
        링크 추가
      </Button>
    </section>
  );
}
