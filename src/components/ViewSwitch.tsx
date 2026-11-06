import type { View } from '@/config/views'
import { BarsIcon, PineIcon } from './icons'

interface ViewSwitchProps {
  view: View
  onChange: (view: View) => void
  disabled?: boolean
}

export function ViewSwitch({ view, onChange, disabled = false }: ViewSwitchProps) {
  return (
    <div className="view-switch" role="group" aria-label="Vistas">
      <button
        type="button"
        className="view-switch__button"
        aria-current={view === 'garden' ? 'page' : undefined}
        disabled={disabled}
        onClick={() => onChange('garden')}
      >
        <PineIcon />
        Bosque
      </button>
      <button
        type="button"
        className="view-switch__button"
        aria-current={view === 'stats' ? 'page' : undefined}
        disabled={disabled}
        onClick={() => onChange('stats')}
      >
        <BarsIcon />
        Estadísticas
      </button>
    </div>
  )
}
