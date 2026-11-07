import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface InfoTipProps {
  /** Nombre accesible del botón, para lectores de pantalla. */
  label: string
  /** Explicación que muestra el popover. */
  text: string
}

const MARGIN = 8
const GAP = 6

/** Ícono de ayuda con un popover redondeado, a juego con el menú del desplegable. */
export function InfoTip({ label, text }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    const popover = popoverRef.current
    if (!trigger || !popover) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const width = popover.offsetWidth
    const height = popover.offsetHeight
    const left = Math.min(
      Math.max(MARGIN, rect.left + rect.width / 2 - width / 2),
      Math.max(MARGIN, window.innerWidth - width - MARGIN),
    )
    const below = rect.bottom + GAP
    const above = rect.top - GAP - height
    const opensUp = below + height > window.innerHeight - MARGIN && above > MARGIN

    setStyle({ top: opensUp ? above : below, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null)
      return
    }
    // El popover ya está montado: se puede medir para ubicarlo sin parpadeos.
    reposition()
  }, [open, reposition])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open, reposition])

  return (
    <span className="info-tip">
      <button
        ref={triggerRef}
        type="button"
        className="info-tip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={id}
            role="tooltip"
            className="info-tip__popover"
            style={style ?? { visibility: 'hidden' }}
          >
            {text}
          </div>,
          document.body,
        )}
    </span>
  )
}
