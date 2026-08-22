import { ContentDialog } from '@hvy/ui';
import { useMemo } from 'react';
import { sanitizeThemeHostileStyles } from '@/util/contentStyleSanitizer';

interface PostPreviewDialogProps {
  open: boolean;
  subject: string;
  body: string;
  onClose: () => void;
}

export default function PostPreviewDialog({
  open,
  subject,
  body,
  onClose,
}: PostPreviewDialogProps) {
  // 발행 페이지(PostComponent)와 동일하게 테마 적대적 인라인 스타일을 제거해 미리보기 일관성 유지
  const sanitizedBody = useMemo(() => {
    if (!body || typeof window === 'undefined') {
      return body;
    }
    const doc = new DOMParser().parseFromString(body, 'text/html');
    sanitizeThemeHostileStyles(doc.body);
    return doc.body.innerHTML;
  }, [body]);

  return (
    <ContentDialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose();
      }}
      title="미리보기"
      size="xl"
    >
      <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto">
        <div className="surface-panel-strong rounded-[1.5rem] px-6 py-8 sm:px-8">
          {subject && <h1 className="mb-6 font-bold text-2xl">{subject}</h1>}
          <div
            className="content break-words"
            // 본문은 자체 작성 콘텐츠이며 sanitizeThemeHostileStyles 를 거친다.
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>
      </div>
    </ContentDialog>
  );
}
