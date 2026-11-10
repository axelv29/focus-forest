import type { TreeSpecies, TreeStage } from '@/state/types'

export interface GrowthStage {
  stage: TreeStage
  /** Porcentaje del pomodoro en el que arranca la etapa. */
  percent: number
  label: string
}

export interface SpeciesConfig {
  id: TreeSpecies
  name: string
  /** Bloque de duración que usa esta especie. */
  minutes: number
  /** Escala de dibujo para que el arte entre en la pradera. */
  scale: number
  stages: readonly GrowthStage[]
}

/**
 * Especies disponibles y su crecimiento.
 *
 * Las etapas se reparten en porcentajes de la duración, así que la misma
 * especie sirve para cualquier pomodoro. El abedul tiene cinco etapas dentro
 * de los 45 minutos; el pino conserva sus cuatro etapas de 25; y el roble
 * tiene siete etapas dentro de los 60.
 */
export const TREE_SPECIES: Record<TreeSpecies, SpeciesConfig> = {
  abedul: {
    id: 'abedul',
    name: 'Abedul',
    minutes: 45,
    scale: 1,
    stages: [
      { stage: 1, percent: 0, label: 'Brote' },
      { stage: 2, percent: 25, label: 'Plantín' },
      { stage: 3, percent: 50, label: 'Joven' },
      { stage: 4, percent: 75, label: 'Maduro' },
      { stage: 5, percent: 100, label: 'Adulto' },
    ],
  },
  pino: {
    id: 'pino',
    name: 'Pino',
    minutes: 25,
    scale: 1,
    stages: [
      { stage: 1, percent: 0, label: 'Brote' },
      { stage: 2, percent: 20, label: 'Joven' },
      { stage: 3, percent: 60, label: 'Maduro' },
      { stage: 4, percent: 100, label: 'Adulto' },
    ],
  },
  roble: {
    id: 'roble',
    name: 'Roble',
    minutes: 60,
    scale: 1,
    stages: [
      { stage: 1, percent: 0, label: 'Brote' },
      { stage: 2, percent: 16, label: 'Plantín' },
      { stage: 3, percent: 33, label: 'Joven' },
      { stage: 4, percent: 50, label: 'Maduro' },
      { stage: 5, percent: 66, label: 'Grande' },
      { stage: 6, percent: 83, label: 'Muy Grande' },
      { stage: 7, percent: 100, label: 'Adulto' },
    ],
  },
}

/** Bloques ordenados de menor a mayor duración. */
const SPECIES_BLOCKS: readonly SpeciesConfig[] = [TREE_SPECIES.pino, TREE_SPECIES.abedul, TREE_SPECIES.roble]

/**
 * Minutos de pomodoro con una especie disponible (un bloque por especie).
 * Los presets sin una serie de sprites configurada se deshabilitan en
 * Ajustes; al sumar una especie, su duración queda habilitada sola.
 */
export function availableFocusMinutes(): readonly number[] {
  return SPECIES_BLOCKS.map((species) => species.minutes)
}

export function speciesConfig(species: TreeSpecies): SpeciesConfig {
  return TREE_SPECIES[species]
}

/**
 * Duración → especie. Usa el bloque más cercano por debajo; si no hay uno,
 * el pino queda como base.
 */
export function speciesForFocusMin(minutes: number): TreeSpecies {
  let current: TreeSpecies = 'pino'

  for (const species of SPECIES_BLOCKS) {
    if (minutes >= species.minutes) {
      current = species.id
    }
  }

  return current
}

/** Los árboles guardados sin especie son pinos de la v1. */
export function speciesFromKind(kind: string | undefined): TreeSpecies {
  if (kind === 'abedul' || kind === 'roble') {
    return kind
  }
  return 'pino'
}

export function finalStage(species: TreeSpecies): TreeStage {
  const stages = speciesConfig(species).stages
  return stages[stages.length - 1].stage
}

export function stageConfig(species: TreeSpecies, stage: TreeStage): GrowthStage {
  const stages = speciesConfig(species).stages
  return stages.find((item) => item.stage === stage) ?? stages[0]
}

/** Minuto visible (redondeado) en el que arranca cada etapa. */
export function stageMinuteMark(
  species: TreeSpecies,
  stage: TreeStage,
  durationMin: number,
): number {
  return Math.round((durationMin * stageConfig(species, stage).percent) / 100)
}
