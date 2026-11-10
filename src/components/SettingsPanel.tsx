import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playTone } from '@/logic/alarm'
import { getNotificationPermission, requestNotificationPermission } from '@/logic/notifications'
import type { AlarmTone, PomodoroSettings } from '@/state/types'
import { availableFocusMinutes } from '@/config/species'
import { BackIcon, VolumeIcon } from './icons'
import { InfoTip } from './InfoTip'
import { Select } from './Select'

interface SettingsPanelProps {
  settings: PomodoroSettings
  onChange: (patch: Partial<PomodoroSettings>) => void
  onBack: () => void
}

const FOCUS_PRESETS = [15, 25, 45, 60, 90, 120]
const AVAILABLE_FOCUS_MINUTES = new Set(availableFocusMinutes())
const BREAK_PRESETS = [3, 5, 10]
const LONG_BREAK_PRESETS = [10, 15, 20, 30]
const LONG_BREAK_EVERY = [2, 3, 4, 5]
const TOLERANCE_PRESETS = [0, 3, 5, 10]

const TONE_LABELS: Record<AlarmTone, string> = {
  bell: 'Campana',
  chime: 'Campanilla',
  pulse: 'Pulso',
}

const FOCUS_OPTIONS = FOCUS_PRESETS.map((value) => ({
  value: String(value),
  label: String(value),
  disabled: !AVAILABLE_FOCUS_MINUTES.has(value),
}))
const BREAK_OPTIONS = BREAK_PRESETS.map((value) => ({ value: String(value), label: String(value) }))
const LONG_BREAK_OPTIONS = LONG_BREAK_PRESETS.map((value) => ({
  value: String(value),
  label: String(value),
}))
const LONG_BREAK_EVERY_OPTIONS = LONG_BREAK_EVERY.map((value) => ({
  value: String(value),
  label: `${value} pomodoros`,
  shortLabel: String(value),
}))
const TOLERANCE_OPTIONS = TOLERANCE_PRESETS.map((value) => ({
  value: String(value),
  label: value === 0 ? 'Desactivado' : String(value),
}))
const TONE_OPTIONS = (Object.keys(TONE_LABELS) as AlarmTone[]).map((tone) => ({
  value: tone,
  label: TONE_LABELS[tone],
}))

/** Cuando el mouse entra en la zona del borde, el scrollbar se hace visible. */
const SCROLLBAR_EDGE_HINT = 28

export function SettingsPanel({ settings, onChange, onBack }: SettingsPanelProps) {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [scrollbarNearEdge, setScrollbarNearEdge] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  const handlePanelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!panel) {
      return
    }

    const rect = panel.getBoundingClientRect()
    setScrollbarNearEdge(rect.right - event.clientX <= SCROLLBAR_EDGE_HINT)
  }

  const handleReset = () => {
    onChange({
      focusMin: 25,
      breakMin: 5,
      longBreakMin: 15,
      longBreakEvery: 4,
      strictPause: false,
      pauseToleranceMin: 0,
      alarmTone: 'bell',
      notification: true,
      alarmVolume: 0.6,
      autoStartBreak: false,
      autoStartFocus: false,
    })
  }

  return (
    <div
      ref={panelRef}
      onPointerMove={handlePanelPointerMove}
      onPointerLeave={() => setScrollbarNearEdge(false)}
      className={`settings-panel flex flex-col gap-4${scrollbarNearEdge ? ' is-scrollbar-visible' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="icon-button"
          onClick={onBack}
          aria-label="Volver al temporizador"
          title="Volver"
        >
          <BackIcon />
        </button>
        <h2 className="type-title">Ajustes</h2>
      </div>

      <section className="flex flex-col gap-2">
        <p className="eyebrow">Tiempos</p>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Pomodoro</span>
            <InfoTip
              label="Más información sobre el pomodoro"
              text="Tiempo en minutos. A los 25 minutos crece un pino; a los 45, un abedul; desde los 60, un roble. Los demás tiempos llegan con nuevas especies."
            />
          </span>
          <Select
            className="select--numeric"
            value={String(settings.focusMin)}
            options={FOCUS_OPTIONS}
            onChange={(value) => onChange({ focusMin: Number(value) })}
            ariaLabel="Pomodoro en minutos"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Descanso corto</span>
            <InfoTip label="Más información sobre el descanso corto" text="Tiempo en minutos." />
          </span>
          <Select
            className="select--numeric"
            value={String(settings.breakMin)}
            options={BREAK_OPTIONS}
            onChange={(value) => onChange({ breakMin: Number(value) })}
            ariaLabel="Descanso corto en minutos"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Descanso largo</span>
            <InfoTip label="Más información sobre el descanso largo" text="Tiempo en minutos." />
          </span>
          <Select
            className="select--numeric"
            value={String(settings.longBreakMin)}
            options={LONG_BREAK_OPTIONS}
            onChange={(value) => onChange({ longBreakMin: Number(value) })}
            ariaLabel="Descanso largo en minutos"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Descanso largo cada</span>
            <InfoTip
              label="Más información sobre cada cuántos pomodoros va el descanso largo"
              text="Cantidad de pomodoros entre un descanso largo y el siguiente."
            />
          </span>
          <Select
            className="select--numeric"
            value={String(settings.longBreakEvery)}
            options={LONG_BREAK_EVERY_OPTIONS}
            onChange={(value) => onChange({ longBreakEvery: Number(value) })}
            ariaLabel="Descanso largo cada cuántos pomodoros"
          />
        </div>
        <p className="type-body type-muted">
          Los tiempos de 15, 90 y 120 minutos llegan cuando haya árboles para esos tiempos.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="eyebrow">Pausa</p>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Pausa estricta</span>
            <InfoTip
              label="Más información sobre la pausa estricta"
              text="Si la activás, pausar equivale a abandonar: se pide confirmación y, si aceptás, el árbol se marchita y el pomodoro no suma minutos."
            />
          </span>
          <input
            type="checkbox"
            className="settings-check"
            aria-label="Pausa estricta"
            checked={settings.strictPause}
            onChange={(e) => onChange({ strictPause: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="settings-label">
            <span className="type-body">Tolerancia</span>
            <InfoTip
              label="Más información sobre la tolerancia de pausa"
              text="Tiempo máximo que la sesión puede quedar en pausa. Si se agota, la sesión se abandona. Con «Desactivado» podés pausar sin límite y no aparece el contador."
            />
          </span>
          <Select
            className="select--numeric"
            value={String(settings.pauseToleranceMin)}
            options={TOLERANCE_OPTIONS}
            disabled={settings.strictPause}
            onChange={(value) => onChange({ pauseToleranceMin: Number(value) })}
            ariaLabel="Tolerancia de pausa en minutos"
          />
        </div>
        {settings.strictPause && (
          <p className="type-body type-muted">Con pausa estricta, pausar equivale a abandonar.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="eyebrow">Alarma</p>
        <div className="flex items-center justify-between gap-3">
          <span className="type-body">Tono</span>
          <div className="flex items-center gap-1">
            <Select
              value={settings.alarmTone}
              options={TONE_OPTIONS}
              onChange={(value) => onChange({ alarmTone: value as AlarmTone })}
              ariaLabel="Tono de la alarma"
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => playTone(settings.alarmTone, settings.alarmVolume)}
              aria-label="Probar tono"
              title="Probar tono"
            >
              <VolumeIcon />
            </button>
          </div>
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="type-body">Volumen</span>
          <input
            type="range"
            className="settings-range"
            min={0}
            max={1}
            step={0.1}
            value={settings.alarmVolume}
            onChange={(e) => onChange({ alarmVolume: Number(e.target.value) })}
            aria-label="Volumen de la alarma"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="type-body">Notificación del navegador</span>
          <input
            type="checkbox"
            className="settings-check"
            aria-label="Notificación del navegador"
            checked={settings.notification}
            onChange={(e) => onChange({ notification: e.target.checked })}
          />
        </label>
        {settings.notification && permission !== 'granted' && (
          <button type="button" className="btn btn-secondary" onClick={handleRequestPermission}>
            Permitir notificaciones
          </button>
        )}
        {permission === 'denied' && (
          <p className="type-body type-muted">Notificaciones bloqueadas en el navegador.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="eyebrow">Automático</p>
        <label className="flex items-center justify-between gap-3">
          <span className="type-body">Auto-iniciar descanso</span>
          <input
            type="checkbox"
            className="settings-check"
            aria-label="Auto-iniciar descanso"
            checked={settings.autoStartBreak}
            onChange={(e) => onChange({ autoStartBreak: e.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="type-body">Auto-iniciar pomodoro</span>
          <input
            type="checkbox"
            className="settings-check"
            aria-label="Auto-iniciar pomodoro"
            checked={settings.autoStartFocus}
            onChange={(e) => onChange({ autoStartFocus: e.target.checked })}
          />
        </label>
      </section>

      <button type="button" className="settings-reset" onClick={handleReset}>
        Restablecer valores
      </button>
    </div>
  )
}
