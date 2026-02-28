import Link from 'next/link'
import {ArrowRight, Clock3, FolderTree, LayoutTemplate, NotebookPen, Radar, ShieldCheck, Workflow} from 'lucide-react'
import AdminPageFrame from '../components/layout/admin/AdminPageFrame'
import {adminQuickLinks} from '../components/layout/admin/adminNavigation'

const dashboardStats = [
  {
    label: '콘텐츠 허브',
    value: '6',
    meta: '주요 관리자 워크플로',
    icon: LayoutTemplate,
  },
  {
    label: '운영 추적',
    value: '2',
    meta: '로그 전용 분석 화면',
    icon: ShieldCheck,
  },
  {
    label: '업무 흐름',
    value: '1',
    meta: '스프린트 리포트 영역',
    icon: Workflow,
  },
]

const statusCards = [
  {
    title: '콘텐츠 정리',
    description: '카테고리와 공통코드, 메모 관리를 한 흐름으로 연결해 두었습니다.',
    icon: FolderTree,
  },
  {
    title: '운영 가시성',
    description: '시스템 로그와 API 로그는 넓은 테이블 작업 공간 기준으로 정리됩니다.',
    icon: Radar,
  },
  {
    title: '작성 집중도',
    description: '에디터와 우측 설정 패널을 분리해 긴 글 작성에도 공간 손실이 적습니다.',
    icon: Clock3,
  },
]

export default function AdminPage() {
  return (
    <AdminPageFrame
      actions={(
        <Link
          href="/admin/write"
          className="inline-flex items-center gap-2 rounded-2xl border border-sky-600/15 bg-sky-600/8 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-600/12"
        >
          새 글 작성
          <ArrowRight className="h-4 w-4"/>
        </Link>
      )}
    >
      <div className="admin-stat-grid">
        {dashboardStats.map(({label, value, meta, icon: Icon}) => (
          <div className="admin-stat-card col-span-12 md:col-span-4" key={label}>
            <div className="flex items-center justify-between gap-3">
              <span className="admin-stat-label">{label}</span>
              <Icon className="h-5 w-5 text-sky-600"/>
            </div>
            <strong className="admin-stat-value">{value}</strong>
            <span className="admin-stat-meta">{meta}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <section className="admin-panel admin-panel-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Quick Access</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--admin-text)]">주요 관리 화면</h2>
            </div>
            <span className="admin-pill">
              {adminQuickLinks.length} links
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {adminQuickLinks.map(({href, label, description, icon: Icon}) => (
              <Link
                href={href}
                key={href}
                className="admin-link-card group p-4"
              >
                <div className="admin-icon-chip mb-4 p-3">
                  <Icon className="h-5 w-5"/>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[color:var(--admin-text)]">{label}</h3>
                  <ArrowRight className="h-4 w-4 text-[color:var(--admin-text-faint)] transition group-hover:text-sky-700"/>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--admin-text-muted)]">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-panel-pad">
          <div className="mb-4 flex items-center gap-3">
            <NotebookPen className="h-5 w-5 text-sky-600"/>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Workspace Notes</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--admin-text)]">이번 셸 방향</h2>
            </div>
          </div>

          <div className="space-y-3">
            {statusCards.map(({title, description, icon: Icon}) => (
              <div
                className="rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)] px-4 py-4"
                key={title}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="admin-icon-chip rounded-xl p-2">
                    <Icon className="h-4 w-4"/>
                  </span>
                  <strong className="text-sm font-semibold text-[color:var(--admin-text)]">{title}</strong>
                </div>
                <p className="text-sm leading-6 text-[color:var(--admin-text-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminPageFrame>
  )
}
