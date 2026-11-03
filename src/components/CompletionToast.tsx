import { useEffect } from 'react'
import { useStore, type NoticeKind } from '@/state/store'

const TONE: Record<NoticeKind, string> = {
  success: 'toast--success',
  warning: 'toast--warning',
  info: 'toast--info',
}

export function CompletionToast() {
  const notice = useStore((state) => state.notice)
  const dismiss = useStore((state) => state.dismissNotice)

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeout = window.setTimeout(dismiss, 4500)
    return () => window.clearTimeout(timeout)
  }, [notice, dismiss])

  if (!notice) {
    return null
  }

  return (
    <div
      className="fixed left-1/2 top-3 z-50 w-[min(92vw,30rem)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div className={`card card--compact type-body font-semibold ${TONE[notice.kind]}`}>
        {notice.text}
      </div>
    </div>
  )
}
