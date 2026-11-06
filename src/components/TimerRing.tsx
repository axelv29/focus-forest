import { formatClock } from '@/logic/timer'

interface TimerRingProps {
  progress: number
  remainingMs: number
  durationMin: number
  paused: boolean
}

const RADIUS = 64
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Anillo de progreso del pomodoro. El relleno avanza en sentido horario. */
export function TimerRing({ progress, remainingMs, durationMin, paused }: TimerRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = CIRCUMFERENCE * (1 - clamped)
  const angle = clamped * 360

  return (
    <div
      className="timer-ring"
      role="progressbar"
      aria-label="Progreso de la sesión"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <svg className="timer-ring__svg" viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient
            id="timer-ring-gradient"
            x1="24"
            y1="136"
            x2="136"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--ring-from)" />
            <stop offset="1" stopColor="var(--ring-to)" />
          </linearGradient>
        </defs>

        <circle className="timer-ring__track" cx="80" cy="80" r={RADIUS} />

        {clamped > 0 && (
          <>
            <circle
              className="timer-ring__fill"
              cx="80"
              cy="80"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
            <g className="timer-ring__tip-group" style={{ transform: `rotate(${angle}deg)` }}>
              <circle className="timer-ring__tip" cx="80" cy="16" r="4.5" />
            </g>
          </>
        )}
      </svg>

      <div className="timer-ring__center">
        <span className="timer-ring__time">{formatClock(remainingMs)}</span>
        <span className="timer-ring__caption">{paused ? 'en pausa' : `de ${durationMin} min`}</span>
      </div>
    </div>
  )
}
