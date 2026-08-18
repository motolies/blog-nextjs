interface UtilityLayoutProps {
  children: React.ReactNode;
}

export default function UtilityLayout({ children }: UtilityLayoutProps) {
  return (
    <div className="public-container px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-14">
      <div className="rounded-[2.2rem] border border-dl-border bg-dl-surface p-1 shadow-dl-card">
        <div className="surface-panel-strong overflow-hidden rounded-[1.9rem]">{children}</div>
      </div>
    </div>
  );
}
