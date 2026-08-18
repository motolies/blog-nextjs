import { Button, ContentDialog, useConfirm } from '@hvy/ui';
import { Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FileComponentProps {
  file: {
    id: string;
    originName: string;
    type: string;
    resourceUri: string;
  };
  onDeleteFile: (file: FileComponentProps['file']) => Promise<void> | void;
  onInsertFile: (file: FileComponentProps['file']) => void;
}

export const FileComponent = (props: FileComponentProps) => {
  const askConfirm = useConfirm();
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const showDeleteConfirmDialog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await askConfirm({
      message: `${props.file.originName} 파일을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    await props.onDeleteFile(props.file);
  };

  const insertFileLink = () => {
    props.onInsertFile(props.file);
  };

  const isImage = props.file.type.startsWith('image');

  return (
    <div
      className={`flex items-center mb-1 px-2 rounded cursor-pointer transition-colors ${isImage ? 'bg-dl-warning-bg hover:bg-dl-warning-bg' : 'bg-dl-tonal hover:bg-dl-tonal-hover'}`}
      onClick={insertFileLink}
    >
      <span className="flex-1 truncate text-sm">{props.file.originName}</span>
      {isImage && (
        <Button
          variant="ghost"
          className="aspect-square p-0 h-6 w-6 ml-auto"
          aria-label="preview"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        className={`aspect-square p-0 h-6 w-6 ${isImage ? '' : 'ml-auto'}`}
        aria-label="delete"
        onClick={showDeleteConfirmDialog}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ContentDialog
        open={showPreview}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setShowPreview(false);
        }}
        title="Preview Image"
        size="xl"
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: 클릭 닫기는 보조 경로 — Esc·닫기 버튼이 기본 경로다 */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: 위와 동일 */}
        <div
          className="m-3 cursor-pointer text-center"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setShowPreview(false);
          }}
        >
          <img
            src={window.location.origin + props.file.resourceUri}
            alt="미리보기 이미지"
            style={{ maxWidth: '90%' }}
          />
        </div>
      </ContentDialog>
    </div>
  );
};
