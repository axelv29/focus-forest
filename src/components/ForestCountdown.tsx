import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Calendar } from 'lucide-react'

interface Countdown {
  label: string
  past: boolean
}

interface ForestCountdownProps {
  countdown: Countdown
}

/** Ícono discreto de calendario: despliega los días restantes al tocar/click, o al pasar el cursor. */
export function ForestCountdown({ countdown }: ForestCountdownProps) {
  const [open, setOpen] = useState(false)

  const tone = countdown.past ? 'forest-countdown--past' : 'forest-countdown--active'

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      setOpen((value) => !value)
    }
  }

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setOpen((value) => !value)
  }

  return (
    <span className={`forest-countdown ${tone}`}>
      <span
        className="forest-countdown__button"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? 'Ocultar días restantes' : `Ver días restantes: ${countdown.label}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Calendar size={13} strokeWidth={1.8} aria-hidden="true" />
      </span>
      {!open && (
        <span className="forest-countdown__tip" role="tooltip">
          {countdown.label}
        </span>
      )}
      {open && (
        <span className="forest-countdown__bubble">
          {countdown.label}
        </span>
      )}
    </span>
  )
}
