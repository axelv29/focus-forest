import { ChartColumn, TreePine, Trees } from 'lucide-react'
import type { View } from '@/config/views'

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
        <TreePine />
        Bosque
      </button>
      <button
        type="button"
        className="view-switch__button"
        aria-current={view === 'stats' ? 'page' : undefined}
        disabled={disabled}
        onClick={() => onChange('stats')}
      >
        <ChartColumn />
        Estadísticas
      </button>
      <button
        type="button"
        className="view-switch__button"
        aria-current={view === 'forests' ? 'page' : undefined}
        disabled={disabled}
        onClick={() => onChange('forests')}
      >
        <Trees />
        Bosques
      </button>
    </div>
  )
}
