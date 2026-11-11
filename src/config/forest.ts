/** Tamaños disponibles para un bosque, en celdas por lado. */
export const FOREST_SIZES = [4, 5, 6, 7, 8] as const

export type ForestSize = (typeof FOREST_SIZES)[number]

export const DEFAULT_FOREST_SIZE: ForestSize = 8
export const DEFAULT_FOREST_NAME = 'Mi bosque'

export const FOREST_NAME_MAX_LENGTH = 40
export const FOREST_DESCRIPTION_MAX_LENGTH = 140
export const FOREST_GOAL_HOURS_MAX = 9999
