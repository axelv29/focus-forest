import { GROWTH_THRESHOLDS } from '@/config/growth'
import type { TreeStage } from '@/state/types'

/**
 * Devuelve la etapa correspondiente a los minutos de enfoque transcurridos.
 * Una sesión de 25 minutos termina siempre en la etapa 4.
 */
export function stageForMinutes(minutes: number): TreeStage {
  let stage: TreeStage = 1

  for (const threshold of GROWTH_THRESHOLDS) {
    if (minutes >= threshold.minutes) {
      stage = threshold.stage
    }
  }

  return stage
}

export function stageForElapsedMs(elapsedMs: number): TreeStage {
  return stageForMinutes(Math.max(0, elapsedMs) / 60_000)
}

export function stageLabel(stage: TreeStage): string {
  return GROWTH_THRESHOLDS.find((threshold) => threshold.stage === stage)?.label ?? 'Brote'
}
