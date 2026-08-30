import { Combobox, showToast } from '@hvy/ui';
import { useEffect, useState } from 'react';
import { ConditionComponent } from '@/components/ConditionComponent';
import { useTags } from '@/hooks/useTags';
import { isSameEntityId } from '@/lib/combobox';
import type { Tag } from '@/types/tag';

interface SearchTagProps {
  onChangeAddTag: (tag: Tag) => void;
  onChangeDeleteTag: (deleteTagId: string) => void;
  defaultTag?: Tag[];
}

export default function SearchTag({
  onChangeAddTag,
  onChangeDeleteTag,
  defaultTag,
}: SearchTagProps) {
  const { data: tagData } = useTags();
  const tags = tagData ?? [];

  const [selectTags, setSelectTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (defaultTag !== undefined) {
      setSelectTags(defaultTag);
    }
  }, [defaultTag]);

  const onDeleteTag = (deleteTagId: string) => {
    onChangeDeleteTag(deleteTagId);
  };

  const onPickTag = (value: string) => {
    const tag = tags.find((t) => isSameEntityId(t.id, value));
    if (!tag) return;
    if (selectTags.some((selectedTag) => isSameEntityId(selectedTag.id, tag.id))) {
      showToast('동일 태그는 한 번만 추가할 수 있습니다.', 'warning');
      return;
    }
    onChangeAddTag(tag);
  };

  return (
    <div className="space-y-2">
      <Combobox
        options={tags.map((tag) => ({ value: String(tag.id), label: tag.name }))}
        pickedValues={selectTags.map((tag) => String(tag.id))}
        onPick={onPickTag}
        triggerLabel="태그 선택(태그끼리 AND 조건)"
        searchPlaceholder="태그 검색..."
        emptyLabel="태그를 찾을 수 없습니다."
        className="public-control-surface public-muted-text public-text-body h-10 w-full rounded-(--radius-card) px-(--public-chip-pad-x) lg:h-11"
      />
      {selectTags.length > 0 ? (
        <div className="public-muted-panel rounded-(--radius-card) border border-dashed p-(--public-pad-card)">
          <p className="public-label-text public-text-meta mb-2 font-semibold uppercase tracking-[0.18em]">
            Tags
          </p>
          <div className="flex min-h-10 flex-wrap gap-2 lg:min-h-11">
            {selectTags.map((t) => (
              <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
