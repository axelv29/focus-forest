import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  dateKeyFromParts,
  dateKeyFromDate,
  formatDateKey,
  monthLabel,
  parseDateKey,
} from '@/logic/forest'
import { CalendarIcon } from './icons'

interface DatePickerProps {
  value: string | null
  onChange: (value: string) => void
  min?: string
  ariaLabel?: string
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const POPOVER_WIDTH = 272
const POPOVER_HEIGHT = 328

interface Position {
  top: number
  left: number
}

export function DatePicker({ value, onChange, min, ariaLabel = 'Elegir fecha' }: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })
  const initial = value ? parseDateKey(value) : null
  const [today] = useState(() => new Date())
  const [viewYear, setViewYear] = useState(initial?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial?.month ?? today.getMonth() + 1)

  const todayValue = dateKeyFromDate(today)
  const minimum = min ?? null

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    const spaceBelow = window.innerHeight - rect.bottom
    const top =
      spaceBelow >= POPOVER_HEIGHT + 8
        ? rect.bottom + 6
        : Math.max(8, rect.top - POPOVER_HEIGHT - 6)
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - POPOVER_WIDTH - 8),
    )

    setPosition({ top, left })
  }

  useLayoutEffect(() => {
    if (open) {
      updatePosition()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const handleReflow = () => updatePosition()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleReflow)
    window.addEventListener('scroll', handleReflow, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleReflow)
      window.removeEventListener('scroll', handleReflow, true)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      const base = value ? parseDateKey(value) : null
      setViewYear(base?.year ?? today.getFullYear())
      setViewMonth(base?.month ?? today.getMonth() + 1)
      updatePosition()
    }
    setOpen((current) => !current)
  }

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(date.getFullYear())
    setViewMonth(date.getMonth() + 1)
  }

  const firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const todayParts = parseDateKey(todayValue)
  const todayDay =
    todayParts && todayParts.year === viewYear && todayParts.month === viewMonth
      ? todayParts.day
      : null

  const choose = (day: number) => {
    const key = dateKeyFromParts(viewYear, viewMonth, day)
    if (minimum && key < minimum) {
      return
    }
    onChange(key)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="date-field"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <CalendarIcon className="date-field__icon" />
        <span
          className={value ? 'date-field__value' : 'date-field__value date-field__value--empty'}
        >
          {value ? formatDateKey(value) : 'Elegir fecha'}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="date-popover"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            role="dialog"
            aria-label={ariaLabel}
          >
            <div className="date-popover__head">
              <button
                type="button"
                className="date-popover__nav"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <p className="date-popover__month">{monthLabel(viewYear, viewMonth)}</p>
              <button
                type="button"
                className="date-popover__nav"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </button>
            </div>

            <div className="date-popover__weekdays" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="date-popover__grid">
              {Array.from({ length: 42 }, (_, index) => {
                const day = index - firstWeekday + 1
                if (day < 1 || day > daysInMonth) {
                  return <span key={index} className="date-day date-day--blank" />
                }

                const key = dateKeyFromParts(viewYear, viewMonth, day)
                const disabled = minimum ? key < minimum : false
                const selected = value === key
                const isToday = day === todayDay

                return (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'date-day',
                      selected ? 'date-day--selected' : '',
                      isToday ? 'date-day--today' : '',
                      disabled ? 'date-day--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => choose(day)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={formatDateKey(key)}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="date-popover__footer">
              <span className="date-popover__hint">
                {minimum ? 'Desde hoy en adelante' : 'Fecha local'}
              </span>
              <button
                type="button"
                className="date-popover__today"
                onClick={() => {
                  const key = dateKeyFromDate(today)
                  if (minimum && key < minimum) {
                    return
                  }
                  onChange(key)
                  setViewYear(today.getFullYear())
                  setViewMonth(today.getMonth() + 1)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                disabled={minimum ? todayValue < minimum : false}
              >
                Hoy
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
