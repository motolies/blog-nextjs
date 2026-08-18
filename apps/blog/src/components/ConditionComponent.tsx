import { Button } from '@hvy/ui';
import { Trash2 } from 'lucide-react';

interface ConditionComponentProps {
  id: string | number;
  name: string;
  onDelete: (id: string | number) => void;
}

export const ConditionComponent = ({ id, name, onDelete }: ConditionComponentProps) => {
  const deleteCondition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-dl-tonal-border bg-dl-tonal px-3 py-1 text-sm font-medium text-dl-tonal-fg transition hover:bg-dl-tonal-hover">
      {name}
      <Button
        variant="ghost"
        size="xs"
        aria-label="delete"
        className="aspect-square p-0 rounded-full text-dl-primary-ink hover:bg-dl-tonal-hover"
        onClick={deleteCondition}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
};
