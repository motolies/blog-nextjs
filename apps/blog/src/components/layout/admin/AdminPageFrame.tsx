import { cn } from '@hvy/ui';

interface AdminPageFrameProps {
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * admin 페이지 공통 프레임.
 * 페이지 타이틀은 상단 fixed 헤더의 브레드크럼(h1)이 정본이므로 여기서는 렌더하지 않는다.
 * actions 가 있으면 tags/hot-deal 페이지들의 액션 바와 동일한 admin-panel 패널로 통일 렌더한다.
 */
export default function AdminPageFrame({
  actions,
  className,
  contentClassName,
  children,
}: AdminPageFrameProps) {
  return (
    <section className={cn('admin-page-frame', className)}>
      {actions ? (
        <div className="admin-panel admin-panel-pad">
          <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
        </div>
      ) : null}

      <div className={cn('admin-workspace', contentClassName)}>{children}</div>
    </section>
  );
}
