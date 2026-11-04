/**
 * Cuatro etapas dentro de los 25 minutos de un pomodoro.
 * El brote aparece al empezar; el árbol madura justo al terminar.
 */
export const GROWTH_THRESHOLDS = [
  { minutes: 0, stage: 1, label: 'Brote' },
  { minutes: 5, stage: 2, label: 'Joven' },
  { minutes: 15, stage: 3, label: 'Maduro' },
  { minutes: 25, stage: 4, label: 'Adulto' },
] as const
