import { speciesConfig, stageConfig } from '@/config/species'
import type { TreeSpecies, TreeStage } from '@/state/types'

/**
 * Devuelve la etapa correspondiente al porcentaje de pomodoro transcurrido.
 * Las etapas son proporcionales a la duración de la especie.
 */
export function stageForMinutes(
  species: TreeSpecies,
  minutes: number,
  durationMin: number,
): TreeStage {
  const stages = speciesConfig(species).stages
  const percent = durationMin > 0 ? (Math.max(0, minutes) / durationMin) * 100 : 100
  let stage: TreeStage = stages[0].stage

  for (const item of stages) {
    if (percent >= item.percent) {
      stage = item.stage
    }
  }

  return stage
}

export function stageForElapsedMs(
  species: TreeSpecies,
  elapsedMs: number,
  durationMin: number,
): TreeStage {
  return stageForMinutes(species, Math.max(0, elapsedMs) / 60_000, durationMin)
}

export function stageLabel(species: TreeSpecies, stage: TreeStage): string {
  return stageConfig(species, stage).label
}
