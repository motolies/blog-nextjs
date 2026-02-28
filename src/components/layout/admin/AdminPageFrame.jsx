import {useRouter} from 'next/router'
import {getAdminRouteMeta} from './adminNavigation'
import {cn} from '../../../lib/utils'

export default function AdminPageFrame({
  title,
  description,
  eyebrow,
  actions,
  className,
  contentClassName,
  children,
}) {
  const router = useRouter()
  const meta = getAdminRouteMeta(router.pathname)

  return (
    <section className={cn('admin-page-frame', className)}>
      <div className="admin-page-header">
        <div className="admin-page-copy">
          <span className="admin-page-eyebrow">{eyebrow || meta.eyebrow}</span>
          <h1 className="admin-page-title">{title || meta.title}</h1>
          <p className="admin-page-description">{description || meta.description}</p>
        </div>
        {actions ? (
          <div className="admin-page-actions">
            {actions}
          </div>
        ) : null}
      </div>

      <div className={cn('admin-workspace', contentClassName)}>
        {children}
      </div>
    </section>
  )
}
