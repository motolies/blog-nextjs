import { Combobox } from '@hvy/ui';
import { useEffect, useState } from 'react';
import { useCategoryFlat } from '@/hooks/useCategories';
import { isSameEntityId, isUnsetComboboxValue } from '@/lib/combobox';
import type { Category } from '@/types/category';

interface FlatCategory extends Category {
  label?: string;
}

interface CategoryAutoCompleteProps {
  onChangeCategory: (category: FlatCategory) => void;
  setCategoryId: string | null | undefined;
  label?: string;
  /** 바깥 `<Label htmlFor>` 과 연결할 트리거 id. */
  id?: string;
}

export default function CategoryAutoComplete({
  onChangeCategory,
  setCategoryId,
  label,
  id,
}: CategoryAutoCompleteProps) {
  const { data: categoryData } = useCategoryFlat();
  const categoryState = (categoryData ?? []) as FlatCategory[];
  const [selectedCategory, setSelectedCategory] = useState<FlatCategory | null>(null);

  useEffect(() => {
    if (isUnsetComboboxValue(setCategoryId)) {
      setSelectedCategory(null);
      return;
    }

    if (categoryState.length === 0) return;

    const cat = categoryState.find((category) => isSameEntityId(category.id, setCategoryId));
    setSelectedCategory(cat || null);
  }, [setCategoryId, categoryState]);

  const onPickCategory = (value: string) => {
    const category = categoryState.find((c) => isSameEntityId(c.id, value));
    if (!category) return;
    setSelectedCategory(category);
    onChangeCategory?.(category);
  };

  return (
    <Combobox
      id={id}
      options={categoryState.map((category) => ({
        value: String(category.id),
        label: category.label || category.name,
      }))}
      pickedValues={selectedCategory ? [String(selectedCategory.id)] : []}
      onPick={onPickCategory}
      triggerLabel={
        selectedCategory ? selectedCategory.label || selectedCategory.name : label || 'Category'
      }
      searchPlaceholder="카테고리 검색..."
      emptyLabel="카테고리를 찾을 수 없습니다."
      className="w-full"
    />
  );
}
