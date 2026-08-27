import { Button, useConfirm } from '@hvy/ui';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { buildSearchHref } from '@/lib/searchHref';
import { searchObjectInit } from '@/model/searchObject';
import { useAuthStore } from '@/store/useAuthStore';

interface TagProps {
  id: string;
  name: string;
  deletePostTag: (params: { tagId: string }) => void;
  clickable?: boolean;
  variant?: 'admin' | 'default';
}

export const Tag = (props: TagProps) => {
  const router = useRouter();
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );
  const askConfirm = useConfirm();
  const isAdminVariant = props.variant === 'admin';

  const showDeleteConfirmDialog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await askConfirm({
      message: `이 포스트에서 ${props.name} 태그를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    await props.deletePostTag({ tagId: props.id });
  };

  const searchTagName = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.currentTarget === e.target) {
      const condition = {
        ...searchObjectInit,
        ...{
          tags: [{ id: props.id, name: props.name }],
        },
      };
      router.push(buildSearchHref(condition));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (props.clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      searchTagName(e);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        isAdminVariant
          ? 'border border-dl-border bg-dl-surface text-[color:var(--admin-text)] hover:border-dl-tonal-border hover:bg-dl-tonal hover:text-dl-primary-ink '
          : 'public-chip-surface public-muted-text border hover:border-dl-tonal-border hover:bg-dl-tonal hover:text-dl-tonal-fg'
      }${props.clickable ? ' cursor-pointer' : ''}`}
      onClick={props.clickable ? searchTagName : undefined}
      {...(props.clickable ? { role: 'button', tabIndex: 0, onKeyDown } : {})}
    >
      {props.name}
      {!(userState.isAuthenticated && userState.user.username) ? null : (
        <Button
          variant="ghost"
          className={`aspect-square p-0 ml-1 h-6 w-6 rounded-full ${
            isAdminVariant
              ? 'text-[color:var(--admin-text-faint)] hover:bg-dl-tonal hover:text-dl-primary-ink '
              : 'public-label-text hover:bg-[color:var(--public-chip-bg)] hover:text-dl-fg'
          }`}
          aria-label="delete"
          onClick={showDeleteConfirmDialog}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
