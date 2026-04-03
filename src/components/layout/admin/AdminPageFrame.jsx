import {useRouter} from 'next/router'
import {getAdminRouteMeta} from './adminNavigation'
import {cn} from '../../../lib/utils'

export default function AdminPageFrame({
  title,
  actions,
  className,
  contentClassName,
  children,
}) {
  const router = useRouter()
  const meta = getAdminRouteMeta(router.pathname)
  const Icon = meta.icon

  return (
    <section className={cn('admin-page-frame', className)}>
      <div className="admin-page-header">
        <div className="admin-page-copy">
          <h1 className="admin-page-title">
            {Icon && <Icon className="admin-page-title-icon" />}
            {title || meta.title}
          </h1>
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
