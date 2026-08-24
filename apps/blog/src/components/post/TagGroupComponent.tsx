import { Combobox, showToast } from '@hvy/ui';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTags } from '@/hooks/useTags';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { isSameEntityId } from '@/lib/combobox';
import service from '@/service';
import { useAuthStore } from '@/store/useAuthStore';
import type { Tag as TagType } from '@/types/tag';
import { Tag } from './TagComponent';

interface TagGroupComponentProps {
  postId: string | null;
  tagList: TagType[];
  clickable?: boolean;
  listHeight?: React.CSSProperties;
  writePage?: boolean;
}

export default function TagGroupComponent({
  postId,
  tagList,
  clickable,
  listHeight,
  writePage = false,
}: TagGroupComponentProps) {
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );
  const { data: allTags } = useTags();
  const [postTags, setPostTags] = useState<TagType[]>(Array.isArray(tagList) ? tagList : []);
  const [isAddTag, setIsAddTag] = useState<boolean>(true);

  useEffect(() => {
    if (tagList === undefined) return;
    setPostTags(Array.isArray(tagList) ? tagList : []);
  }, [tagList]);

  const availableTags = useMemo(() => {
    const postTagIds = new Set(postTags.map((t) => t.id));
    return (allTags ?? []).filter((tag) => !postTagIds.has(tag.id));
  }, [allTags, postTags]);

  const onPickTag = (value: string) => {
    const tag = availableTags.find((t) => isSameEntityId(t.id, value));
    if (!tag) return;
    if ((postTags ?? []).some((postTag) => isSameEntityId(postTag.id, tag.id))) {
      showToast('동일 태그는 한 번만 추가할 수 있습니다.', 'warning');
      return;
    }
    addTagOnPost(tag.name);
  };

  const addTagOnPost = (tagName: string) => {
    if (!isAddTag) return;
    setIsAddTag(false);
    service.post
      .addTag({ postId: postId, tagName: tagName })
      .then((res: { status: number; data: TagType }) => {
        if (res.status >= 200 && res.status < 300) {
          const createdTag = res.data;
          setPostTags((prev) =>
            prev.some((t) => isSameEntityId(t.id, createdTag.id)) ? prev : [...prev, createdTag],
          );
          showToast(`태그가 추가되었습니다.`);
        }
      })
      .finally(() => {
        setIsAddTag(true);
      });
  };

  const handleAddNewTag = (inputValue: string) => {
    if (inputValue.trim().length > 1) {
      addTagOnPost(inputValue.trim());
    } else {
      showToast(`태그는 두 글자 이상이어야 합니다.`, 'error');
    }
  };

  const deletePostTag = ({ tagId }: { tagId: string }) => {
    service.post
      .deleteTag({ postId: postId, tagId: tagId })
      .then((res: { status: number }) => {
        if (res.status >= 200 && res.status < 300) {
          setPostTags((prev) => prev.filter((tag) => !isSameEntityId(tag.id, tagId)));
          showToast('태그 삭제에 성공하였습니다.');
        }
      })
      .catch((error) => {
        showApiErrorToast('태그 삭제에 실패하였습니다.', error);
      });
  };

  return (
    <div className="space-y-2">
      {!(userState.isAuthenticated && userState.user.username) ? null : (
        <Combobox
          options={availableTags.map((tag) => ({ value: String(tag.id), label: tag.name }))}
          onPick={onPickTag}
          onCreate={handleAddNewTag}
          // handleAddNewTag 가 2자 미만을 거부한다 — 행을 띄워 놓고 누르면 실패시키지 않는다.
          minCreateLength={2}
          createLabel={(input) => `+ "${input}" 새 태그 추가`}
          triggerLabel="Add Tags"
          searchPlaceholder="태그 검색 또는 새 태그 입력..."
          emptyLabel="일치하는 태그가 없습니다."
          className={
            writePage
              ? 'w-full border-dl-border bg-dl-surface text-[color:var(--admin-text)] hover:bg-dl-tonal'
              : 'public-control-surface public-muted-text h-11 w-full rounded-full'
          }
        />
      )}

      <div className="flex flex-wrap gap-2" style={listHeight}>
        {postTags
          ? postTags.map((tag) => (
              <Tag
                key={tag.id}
                id={tag.id}
                name={tag.name}
                deletePostTag={deletePostTag}
                clickable={clickable}
                variant={writePage ? 'admin' : 'default'}
              />
            ))
          : null}
      </div>
    </div>
  );
}
