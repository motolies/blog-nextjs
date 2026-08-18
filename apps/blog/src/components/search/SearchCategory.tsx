import { Combobox, showToast } from '@hvy/ui';
import { useEffect, useState } from 'react';
import { ConditionComponent } from '@/components/ConditionComponent';
import { useCategoryFlat } from '@/hooks/useCategories';
import { isSameEntityId } from '@/lib/combobox';

interface CategoryItem {
  id: string;
  name: string;
  label?: string;
}

interface SearchCategoryProps {
  onChangeAddCategory: (category: CategoryItem) => void;
  onChangeDeleteCategory: (deleteCategoryId: string) => void;
  defaultCategory?: CategoryItem[];
}

export default function SearchCategory({
  onChangeAddCategory,
  onChangeDeleteCategory,
  defaultCategory,
}: SearchCategoryProps) {
  const { data: categoryData } = useCategoryFlat();
  const categories = (categoryData ?? []) as CategoryItem[];

  const [selectCategories, setSelectCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    if (defaultCategory !== undefined) {
      setSelectCategories(defaultCategory);
    }
  }, [defaultCategory]);

  const onDeleteTag = (deleteCategoryId: string) => {
    onChangeDeleteCategory(deleteCategoryId);
  };

  const onPickCategory = (value: string) => {
    const category = categories.find((c) => isSameEntityId(c.id, value));
    if (!category) return;
    if (
      selectCategories.some((selectedCategory) => isSameEntityId(selectedCategory.id, category.id))
    ) {
      showToast('동일 카테고리는 한 번만 추가할 수 있습니다.', 'warning');
      return;
    }
    onChangeAddCategory(category);
  };

  return (
    <div className="space-y-2">
      <Combobox
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.label || category.name,
        }))}
        pickedValues={selectCategories.map((category) => String(category.id))}
        onPick={onPickCategory}
        triggerLabel="카테고리(하위포함, OR 조건)"
        searchPlaceholder="카테고리 검색..."
        emptyLabel="카테고리를 찾을 수 없습니다."
        className="public-control-surface public-muted-text h-11 w-full rounded-[1.15rem] px-4"
      />
      {selectCategories.length > 0 ? (
        <div className="public-muted-panel rounded-[1.5rem] border border-dashed p-3.5">
          <p className="public-label-text mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
            Categories
          </p>
          <div className="flex min-h-11 flex-wrap gap-2">
            {selectCategories.map((t) => (
              <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
