import { useEffect, useState } from 'react'
import { useStore } from '@/state/store'

/**
 * Reloj de la interfaz. Cada tick actualiza el restante y reconcilia la
 * sesión activa: si venció mientras la pestaña estaba cerrada, se completa
 * o se cierra una sola vez.
 */
export function useCountdown(intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now())
  const reconcile = useStore((state) => state.reconcile)

  useEffect(() => {
    const tick = () => {
      const current = Date.now()
      setNow(current)
      reconcile(current)
    }

    tick()
    const interval = window.setInterval(tick, intervalMs)

    return () => window.clearInterval(interval)
  }, [intervalMs, reconcile])

  return now
}
