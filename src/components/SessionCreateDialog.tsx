import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { finalStage, speciesConfig, speciesForFocusMin } from '@/config/species'
import {
  SESSION_DESCRIPTION_MAX_LENGTH,
  SESSION_MAX_POMODOROS,
  SESSION_MAX_TASKS,
  SESSION_TASK_MAX_LENGTH,
  SESSION_TITLE_MAX_LENGTH,
} from '@/config/session'
import { useStore } from '@/state/store'
import type { NewSessionInput } from '@/state/types'
import { CloseIcon, MinusIcon, PineIcon, PlusIcon } from './icons'
import { TreePreview } from './TreePreview'

interface SessionCreateDialogProps {
  open: boolean
  forestName: string
  onClose: () => void
  onStart: (input: NewSessionInput) => void
}

type SessionMode = 'single' | 'multi'

export function SessionCreateDialog({
  open,
  forestName,
  onClose,
  onStart,
}: SessionCreateDialogProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const settings = useStore((state) => state.settings)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [mode, setMode] = useState<SessionMode>('single')
  const [multiCount, setMultiCount] = useState(3)

  const reset = useCallback(() => {
    setTitle('')
    setDescription('')
    setTasks([])
    setMode('single')
    setMultiCount(3)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    reset()
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open, reset])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

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

  const targetPomodoros = mode === 'single' ? 1 : multiCount
  const focusMin = settings.focusMin
  const species = speciesForFocusMin(focusMin)
  const config = speciesConfig(species)
  const totalFocus = focusMin * targetPomodoros
  const breakCount = targetPomodoros - 1
  const totalWithBreaks = totalFocus + breakCount * settings.breakMin
  const previewStage = finalStage(species)

  const updateTask = (index: number, value: string) => {
    setTasks((current) => current.map((task, itemIndex) => (itemIndex === index ? value : task)))
  }

  const addTask = () => {
    setTasks((current) =>
      current.length >= SESSION_MAX_TASKS ? current : [...current, ''],
    )
  }

  const removeTask = (index: number) => {
    setTasks((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) {
      titleRef.current?.focus()
      return
    }

    onStart({
      title,
      description: description.trim() || null,
      tasks,
      targetPomodoros,
    })
    handleClose()
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
        className="card card--roomy forest-dialog session-dialog my-auto w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-dialog-title"
      >
        <div className="forest-dialog__head">
          <div className="flex min-w-0 items-start gap-3">
            <span className="session-icon forest-dialog__icon">
              <PineIcon />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{forestName}</p>
              <h2 id="session-dialog-title" className="type-title-lg">
                Nueva sesión
              </h2>
              <p className="type-caption type-muted forest-dialog__sub">
                Ponele un nombre a este rato de enfoque. Podés hacer un solo pomodoro o una serie
                con varios árboles.
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

        <form id="session-form" className="forest-dialog__body" onSubmit={handleSubmit}>
          <div className="forest-dialog__form">
            <div className="forest-field">
              <label className="settings-label" htmlFor="session-title">
                <span className="type-body">Nombre de la sesión</span>
              </label>
              <input
                ref={titleRef}
                id="session-title"
                className="field-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={SESSION_TITLE_MAX_LENGTH}
                placeholder="Terminar el TP, estudiar para el final…"
                autoComplete="off"
              />
            </div>

            <div className="forest-field">
              <div className="forest-field__label-row">
                <label className="settings-label" htmlFor="session-description">
                  <span className="type-body">Descripción</span>
                </label>
                <span className="type-micro type-muted">Opcional</span>
              </div>
              <textarea
                id="session-description"
                className="field-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={SESSION_DESCRIPTION_MAX_LENGTH}
                rows={2}
                placeholder="Qué querés tener claro al terminar."
              />
              <span className="forest-field__counter type-micro type-muted">
                {description.length}/{SESSION_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <div className="forest-field">
              <div className="forest-field__label-row">
                <span className="settings-label">
                  <span className="type-body">Objetivos</span>
                </span>
                <span className="type-micro type-muted">Opcional</span>
              </div>

              {tasks.length > 0 && (
                <ul className="session-objectives">
                  {tasks.map((task, index) => (
                    <li key={`objective-${index}`} className="session-objective">
                      <span className="session-objective__mark" aria-hidden="true" />
                      <input
                        className="field-input session-objective__input"
                        value={task}
                        onChange={(event) => updateTask(index, event.target.value)}
                        maxLength={SESSION_TASK_MAX_LENGTH}
                        placeholder="Un paso concreto"
                        aria-label={`Objetivo ${index + 1}`}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="icon-button session-objective__remove"
                        onClick={() => removeTask(index)}
                        aria-label={`Quitar objetivo ${index + 1}`}
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {tasks.length < SESSION_MAX_TASKS && (
                <button type="button" className="btn btn-secondary btn--sm session-add-task" onClick={addTask}>
                  <PlusIcon />
                  Agregar objetivo
                </button>
              )}
            </div>

            <div className="forest-field">
              <span className="settings-label">
                <span className="type-body">Duración</span>
              </span>
              <div className="session-mode" role="group" aria-label="Cantidad de pomodoros">
                <button
                  type="button"
                  className="session-mode__option"
                  aria-pressed={mode === 'single'}
                  onClick={() => setMode('single')}
                >
                  <span className="session-mode__title">Un pomodoro</span>
                  <span className="session-mode__detail">{focusMin} min · un árbol</span>
                </button>
                <button
                  type="button"
                  className="session-mode__option"
                  aria-pressed={mode === 'multi'}
                  onClick={() => setMode('multi')}
                >
                  <span className="session-mode__title">Varios pomodoros</span>
                  <span className="session-mode__detail">Una serie con un árbol por pomodoro</span>
                </button>
              </div>

              {mode === 'multi' && (
                <div className="session-count">
                  <button
                    type="button"
                    className="icon-button session-count__button"
                    onClick={() => setMultiCount((count) => Math.max(2, count - 1))}
                    disabled={multiCount <= 2}
                    aria-label="Quitar un pomodoro"
                  >
                    <MinusIcon />
                  </button>
                  <span className="session-count__value">
                    <strong>{multiCount}</strong> pomodoros
                  </span>
                  <button
                    type="button"
                    className="icon-button session-count__button"
                    onClick={() =>
                      setMultiCount((count) => Math.min(SESSION_MAX_POMODOROS, count + 1))
                    }
                    disabled={multiCount >= SESSION_MAX_POMODOROS}
                    aria-label="Agregar un pomodoro"
                  >
                    <PlusIcon />
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="forest-preview session-preview" aria-label="Resumen de la sesión">
            <div className="session-preview__scene">
              <div className="session-preview__trees" aria-hidden="true">
                {Array.from({ length: Math.min(4, targetPomodoros) }, (_, index) => (
                  <span key={index} className="session-preview__tree">
                    <TreePreview species={species} stage={previewStage} />
                  </span>
                ))}
                {targetPomodoros > 4 && (
                  <span className="session-preview__more type-micro">+{targetPomodoros - 4}</span>
                )}
              </div>
              <span className="session-preview__ground" aria-hidden="true" />
            </div>

            <div className="forest-preview__body">
              <div className="forest-preview__title-row">
                <h3 className="type-title">{title.trim() || 'Tu sesión'}</h3>
                <span className="forest-preview__size">{targetPomodoros}×</span>
              </div>
              <p className="forest-preview__description type-caption type-muted">
                {description.trim() || 'Sin descripción todavía.'}
              </p>
              <div className="forest-preview__meta">
                <span className="type-micro type-muted">
                  {config.name} · {targetPomodoros === 1 ? 'un árbol' : `${targetPomodoros} árboles`}
                </span>
                <span className="forest-chip forest-chip--soft">{totalFocus} min</span>
              </div>
              <div className="forest-preview__divider" />
              <div className="forest-preview__details">
                <span className="forest-chip forest-chip--soft">{focusMin} min por pomodoro</span>
                {breakCount > 0 && (
                  <span className="forest-chip">
                    + {breakCount * settings.breakMin} min de pausas
                  </span>
                )}
              </div>
              <p className="session-preview__note type-micro type-muted">
                {targetPomodoros === 1
                  ? 'Al completar el pomodoro, el árbol queda plantado.'
                  : `La serie completa ocupa unos ${totalWithBreaks} min. Los árboles se agrupan en el historial.`}
              </p>
            </div>
          </aside>
        </form>

        <div className="forest-dialog__actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" form="session-form" className="btn btn-primary" disabled={!title.trim()}>
            Empezar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
