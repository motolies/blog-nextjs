import Link from 'next/link'
import {ArrowRight, FolderTree, NotebookPen, PanelsTopLeft, Tags} from 'lucide-react'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

const relatedLinks = [
  {
    href: '/admin/categories',
    label: '카테고리 관리',
    description: '분류 체계와 계층 구조를 먼저 정리합니다.',
    icon: FolderTree,
  },
  {
    href: '/admin/master-code',
    label: '마스터코드 관리',
    description: '태그 확장에 필요한 공통 값 체계를 점검합니다.',
    icon: PanelsTopLeft,
  },
  {
    href: '/admin/memo',
    label: '메모 관리',
    description: '태그 정책과 운영 메모를 함께 정리합니다.',
    icon: NotebookPen,
  },
]

export default function TagsPage() {
  return (
    <AdminPageFrame>
      <section className="admin-panel admin-panel-pad">
        <div className="admin-empty-state">
          <span className="admin-icon-chip rounded-[1.15rem] p-3">
            <Tags className="h-6 w-6"/>
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--admin-text)]">태그 관리 화면은 다음 단계에서 확장됩니다.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--admin-text-muted)]">
              이번 작업에서는 관리자 전체 디자인 톤과 작업공간 구조를 먼저 통일했습니다.
              태그 관리 기능이 추가되면 같은 패널 시스템 안에서 바로 확장할 수 있도록 준비된 상태입니다.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {relatedLinks.map(({href, label, description, icon: Icon}) => (
          <Link
            href={href}
            key={href}
            className="admin-link-card admin-panel-pad group"
          >
            <div className="admin-icon-chip mb-4 rounded-2xl p-3">
              <Icon className="h-5 w-5"/>
            </div>
            <div className="flex items-center justify-between gap-3">
              <strong className="text-base font-semibold text-[color:var(--admin-text)]">{label}</strong>
              <ArrowRight className="h-4 w-4 text-[color:var(--admin-text-faint)] transition group-hover:text-sky-700"/>
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--admin-text-muted)]">{description}</p>
          </Link>
        ))}
      </div>
    </AdminPageFrame>
  )
}
