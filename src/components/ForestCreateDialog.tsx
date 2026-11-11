import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  FOREST_DESCRIPTION_MAX_LENGTH,
  FOREST_GOAL_HOURS_MAX,
  FOREST_NAME_MAX_LENGTH,
  FOREST_SIZES,
  type ForestSize,
} from '@/config/forest'
import { describeForestCountdown, formatDateKey, shiftDateKey, todayKey } from '@/logic/forest'
import { useStore } from '@/state/store'
import type { Forest, NewForestInput } from '@/state/types'
import { DatePicker } from './DatePicker'
import { ForestPreviewCanvas } from './ForestPreviewCanvas'
import { CloseIcon, PineIcon } from './icons'
import { Select } from './Select'

interface ForestCreateDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (input: NewForestInput, forestId?: string) => string | null
  /** Cuando está presente, el diálogo edita ese bosque en vez de crear uno. */
  forest?: Forest | null
}

const SIZE_OPTIONS = FOREST_SIZES.map((size) => ({
  value: String(size),
  label: `${size}×${size}`,
}))

export function ForestCreateDialog({ open, onClose, onCreate, forest }: ForestCreateDialogProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState<ForestSize>(8)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [goalHours, setGoalHours] = useState('')
  const [error, setError] = useState<string | null>(null)

  const allTrees = useStore((state) => state.trees)
  const isEditing = forest != null
  // En edición la vista previa muestra los árboles reales, igual que el selector.
  const forestTrees = useMemo(
    () => (forest ? allTrees.filter((tree) => tree.forestId === forest.id) : null),
    [allTrees, forest],
  )

  const reset = useCallback((target?: Forest | null) => {
    setName(target?.name ?? '')
    setDescription(target?.description ?? '')
    setSize(target?.size ?? 8)
    setHasEndDate(target?.endsOn != null)
    setEndDate(target?.endsOn ?? null)
    setGoalHours(target?.goalHours != null ? String(target.goalHours) : '')
    setError(null)
  }, [])

  const forestKey = open ? (forest?.id ?? 'new') : null
  const [appliedKey, setAppliedKey] = useState<string | null>(null)
  if (forestKey !== appliedKey) {
    setAppliedKey(forestKey)
    reset(forest ?? null)
  }

  const handleClose = useCallback(() => {
    reset(null)
    setAppliedKey(null)
    onClose()
  }, [onClose, reset])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(() => nameRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  if (!open) {
    return null
  }

  const countdown = endDate ? describeForestCountdown(endDate) : null
  const capacity = size * size
  const treeCount = forestTrees?.length ?? 0
  const parsedGoal = Number(goalHours)
  const goal =
    goalHours.trim() !== '' && Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Poné un nombre para reconocer el bosque.')
      nameRef.current?.focus()
      return
    }

    if (hasEndDate && !endDate) {
      setError('Elegí la fecha de finalización o desmarcá la opción.')
      return
    }

    const created = onCreate(
      {
        name,
        description,
        size,
        endsOn: hasEndDate ? endDate : null,
        goalHours: goal,
      },
      forest?.id,
    )

    if (created) {
      handleClose()
    }
  }

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className="card card--roomy forest-dialog my-auto w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forest-dialog-title"
      >
        <div className="forest-dialog__head">
          <div className="flex min-w-0 items-start gap-3">
            <span className="session-icon forest-dialog__icon">
              <PineIcon />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{forest ? 'Editar bosque' : 'Nuevo bosque'}</p>
              <h2 id="forest-dialog-title" className="type-title-lg">
                Un objetivo, un lugar para crecer
              </h2>
              <p className="type-caption type-muted forest-dialog__sub">
                Nombrá el bosque y elegí cuánto espacio va a tener. La fecha y la meta son
                opcionales.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button forest-dialog__close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <form id="forest-form" className="forest-dialog__body" onSubmit={handleSubmit}>
          <div className="forest-dialog__form">
            <div className="forest-field">
              <label className="settings-label" htmlFor="forest-name">
                <span className="type-body">Nombre</span>
              </label>
              <input
                ref={nameRef}
                id="forest-name"
                className="field-input"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (error) {
                    setError(null)
                  }
                }}
                maxLength={FOREST_NAME_MAX_LENGTH}
                placeholder="Semestre 2026, Cálculo I, Examen final…"
                autoComplete="off"
              />
            </div>

            <div className="forest-field">
              <div className="forest-field__label-row">
                <label className="settings-label" htmlFor="forest-description">
                  <span className="type-body">Descripción</span>
                </label>
                <span className="type-micro type-muted">Opcional</span>
              </div>
              <textarea
                id="forest-description"
                className="field-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={FOREST_DESCRIPTION_MAX_LENGTH}
                rows={3}
                placeholder="Qué querés sostener en este bosque."
              />
              <span className="forest-field__counter type-micro type-muted">
                {description.length}/{FOREST_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <div className="forest-field">
              <label className="settings-label" htmlFor="forest-size">
                <span className="type-body">Tamaño</span>
              </label>
              <Select
                className="select--block"
                value={String(size)}
                options={SIZE_OPTIONS}
                onChange={(value) => setSize(Number(value) as ForestSize)}
                ariaLabel="Tamaño del bosque"
                disabled={isEditing}
              />
              <span className="forest-field__hint type-caption type-muted">
                {capacity} espacios para árboles
              </span>
              {isEditing && (
                <span className="forest-field__hint type-caption type-muted">
                  El tamaño no se puede cambiar una vez creado.
                </span>
              )}
            </div>

            <div className="forest-field">
              <label className="forest-check">
                <input
                  type="checkbox"
                  className="settings-check"
                  checked={hasEndDate}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setHasEndDate(checked)
                    if (checked && !endDate) {
                      setEndDate(shiftDateKey(todayKey(), 30))
                    }
                    if (error) {
                      setError(null)
                    }
                  }}
                />
                <span className="type-body">Poner una fecha de finalización</span>
              </label>

              {hasEndDate && (
                <div className="forest-date-row">
                  <DatePicker
                    value={endDate}
                    onChange={(value) => {
                      setEndDate(value)
                      if (error) {
                        setError(null)
                      }
                    }}
                    min={todayKey()}
                    ariaLabel="Fecha de finalización del bosque"
                  />
                  {endDate && countdown && (
                    <span
                      className={countdown.past ? 'forest-chip forest-chip--past' : 'forest-chip'}
                    >
                      {countdown.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="forest-field">
              <div className="forest-field__label-row">
                <label className="settings-label" htmlFor="forest-goal">
                  <span className="type-body">Meta de horas</span>
                </label>
                <span className="type-micro type-muted">Opcional</span>
              </div>
              <div className="forest-goal">
                <input
                  id="forest-goal"
                  className="field-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={FOREST_GOAL_HOURS_MAX}
                  step={1}
                  value={goalHours}
                  onChange={(event) => setGoalHours(event.target.value)}
                  placeholder="Por ejemplo, 40"
                />
                <span className="type-caption type-muted">horas de enfoque</span>
              </div>
              <span className="forest-field__hint type-caption type-muted">
                Solo para medir el avance; no bloquea las sesiones.
              </span>
            </div>

            {error && (
              <p className="forest-form__error type-caption" role="alert">
                {error}
              </p>
            )}
          </div>

          <aside className="forest-preview" aria-label="Vista previa del bosque">
            <div className="forest-preview__canvas-wrap">
              <ForestPreviewCanvas
                size={size}
                trees={forestTrees ?? undefined}
                example={!isEditing}
              />
            </div>
            <div className="forest-preview__body">
              <div className="forest-preview__title-row">
                <h3 className="type-title">{name.trim() || 'Tu bosque'}</h3>
                <span className="forest-preview__size">
                  {size}×{size}
                </span>
              </div>
              <p className="forest-preview__description type-caption type-muted">
                {description.trim() || 'Sin descripción todavía.'}
              </p>
              <div className="forest-preview__meta">
                <span className="type-micro type-muted">
                  {isEditing
                    ? `${treeCount} ${treeCount === 1 ? 'árbol' : 'árboles'}`
                    : 'Árboles de ejemplo'}
                </span>
                <span className="forest-chip forest-chip--soft">{capacity} espacios</span>
              </div>
              <div className="forest-preview__divider" />
              <div className="forest-preview__details">
                <span className="type-caption type-muted">
                  {hasEndDate && endDate
                    ? `Hasta el ${formatDateKey(endDate)}`
                    : 'Sin fecha de finalización'}
                </span>
                {hasEndDate && countdown && (
                  <span
                    className={countdown.past ? 'forest-chip forest-chip--past' : 'forest-chip'}
                  >
                    {countdown.label}
                  </span>
                )}
                {goal !== null && (
                  <span className="forest-chip forest-chip--soft">Meta · {goal} h</span>
                )}
              </div>
            </div>
          </aside>
        </form>

        <div className="forest-dialog__actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="forest-form"
            className="btn btn-primary"
            disabled={!name.trim()}
          >
            Crear bosque
          </button>
        </div>
      </div>
    </div>
  )
}
