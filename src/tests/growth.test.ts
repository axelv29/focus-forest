import { describe, expect, it } from 'vitest'
import { stageForElapsedMs, stageForMinutes, stageLabel } from '@/logic/growth'

describe('stageForMinutes', () => {
  it.each([
    [-10, 1],
    [0, 1],
    [4.99, 1],
    [5, 2],
    [14.99, 2],
    [15, 3],
    [24.99, 3],
    [25, 4],
    [60, 4],
  ])('con %s minutos devuelve la etapa %s', (minutes, expected) => {
    expect(stageForMinutes(minutes)).toBe(expected)
  })
})

describe('stageForElapsedMs', () => {
  it('convierte milisegundos a minutos', () => {
    expect(stageForElapsedMs(0)).toBe(1)
    expect(stageForElapsedMs(5 * 60_000)).toBe(2)
    expect(stageForElapsedMs(15 * 60_000)).toBe(3)
    expect(stageForElapsedMs(25 * 60_000)).toBe(4)
  })

  it('no rompe con valores negativos', () => {
    expect(stageForElapsedMs(-1)).toBe(1)
  })
})

describe('stageLabel', () => {
  it('devuelve la etiqueta de cada etapa', () => {
    expect(stageLabel(1)).toBe('Brote')
    expect(stageLabel(2)).toBe('Joven')
    expect(stageLabel(3)).toBe('Maduro')
    expect(stageLabel(4)).toBe('Adulto')
  })
})
