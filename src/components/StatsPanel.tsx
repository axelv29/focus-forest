import { ViewSwitch } from '@/components/ViewSwitch'
import { GRID_COLS, GRID_ROWS } from '@/config/grid'
import type { View } from '@/config/views'
import { selectActiveForest, selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'

interface StatsPanelProps {
  now: number
  view: View
  onChangeView: (view: View) => void
}

export function StatsPanel({ now, view, onChangeView }: StatsPanelProps) {
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const activeForest = selectActiveForest(forests, activeForestId)
  const stats = selectStats(sessions, trees, now, activeForest?.id)
  const globalStats = selectStats(sessions, trees, now)
  const totalCells = activeForest ? activeForest.size * activeForest.size : GRID_COLS * GRID_ROWS

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16" aria-label="Estadísticas">
      <div className="mx-auto mb-7 w-full max-w-xs">
        <ViewSwitch view={view} onChange={onChangeView} />
      </div>

      <p className="eyebrow">Estadísticas</p>
      <h2 className="type-title-lg mt-2">Tu bosque en números</h2>
      {activeForest && <p className="type-caption type-muted mt-1">{activeForest.name}</p>}

      <div className="stat-grid mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Hoy"
          value={`${stats.todayPomodoros}`}
          unit="pomodoros"
          detail={`${stats.todayMinutes} minutos de enfoque`}
        />
        <StatCard
          label="Total"
          value={`${stats.totalPomodoros}`}
          unit="pomodoros"
          detail={`${stats.totalMinutes} minutos de enfoque`}
        />
        <StatCard
          label="Árboles"
          value={`${stats.matureTrees}`}
          unit="adultos"
          detail={`${stats.witheredTrees} marchitos`}
        />
        <StatCard
          label="Pradera"
          value={`${stats.matureTrees + stats.witheredTrees}`}
          unit={`de ${totalCells} celdas`}
          detail="Los árboles adultos ocupan su lugar"
        />
      </div>

      <p className="type-body type-muted mt-6">
        Solo los pomodoros completados suman minutos. Los descansos no plantan árboles.
      </p>
      {forests.length > 1 && (
        <p className="type-caption type-muted mt-1">
          En todos los bosques: {globalStats.totalPomodoros} pomodoros y {globalStats.totalMinutes}{' '}
          minutos de enfoque.
        </p>
      )}
    </section>
  )
}

interface StatCardProps {
  label: string
  value: string
  unit: string
  detail: string
}

function StatCard({ label, value, unit, detail }: StatCardProps) {
  return (
    <article className="card">
      <p className="eyebrow">{label}</p>
      <p className="type-stat mt-3">{value}</p>
      <p className="type-body type-muted">{unit}</p>
      <p className="type-caption type-muted mt-2">{detail}</p>
    </article>
  )
}
