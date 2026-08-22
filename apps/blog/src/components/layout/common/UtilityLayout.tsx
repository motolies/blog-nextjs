interface UtilityLayoutProps {
  children: React.ReactNode;
}

/**
 * /util 전용 래퍼 — 단일 표면 패널로 감싼다.
 * 내부 패딩은 여기서 소유한다 — 페이지마다 패딩이 다르면 목록↔상세 이동 시 좌측 라인이 점프한다.
 */
export default function UtilityLayout({ children }: UtilityLayoutProps) {
  return (
    <div className="public-container pb-12 pt-6 sm:pt-10 lg:pb-14">
      <div className="surface-panel-strong overflow-hidden rounded-(--radius-panel) p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
