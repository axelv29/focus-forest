import { describe, expect, it } from 'vitest'
import { stageForElapsedMs, stageForMinutes, stageLabel } from '@/logic/growth'

describe('stageForMinutes del abedul (45 min)', () => {
  it.each([
    [-10, 1],
    [0, 1],
    [11.24, 1],
    [11.25, 2],
    [22.49, 2],
    [22.5, 3],
    [33.74, 3],
    [33.75, 4],
    [44.99, 4],
    [45, 5],
    [60, 5],
  ])('con %s minutos devuelve la etapa %s', (minutes, expected) => {
    expect(stageForMinutes('abedul', minutes, 45)).toBe(expected)
  })
})

describe('stageForMinutes del pino (25 min)', () => {
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
    expect(stageForMinutes('pino', minutes, 25)).toBe(expected)
  })
})

describe('stageForMinutes del roble (60 min)', () => {
  it.each([
    [-10, 1],
    [0, 1],
    [9, 1],
    [10, 2],
    [19, 2],
    [20, 3],
    [29, 3],
    [30, 4],
    [39, 4],
    [40, 5],
    [49, 5],
    [50, 6],
    [59, 6],
    [60, 7],
    [120, 7],
  ])('con %s minutos devuelve la etapa %s', (minutes, expected) => {
    expect(stageForMinutes('roble', minutes, 60)).toBe(expected)
  })
})

describe('stageForElapsedMs', () => {
  it('convierte milisegundos a minutos para el abedul', () => {
    expect(stageForElapsedMs('abedul', 0, 45)).toBe(1)
    expect(stageForElapsedMs('abedul', 11.25 * 60_000, 45)).toBe(2)
    expect(stageForElapsedMs('abedul', 22.5 * 60_000, 45)).toBe(3)
    expect(stageForElapsedMs('abedul', 33.75 * 60_000, 45)).toBe(4)
    expect(stageForElapsedMs('abedul', 45 * 60_000, 45)).toBe(5)
  })

  it('respeta la duración del pino', () => {
    expect(stageForElapsedMs('pino', 0, 25)).toBe(1)
    expect(stageForElapsedMs('pino', 5 * 60_000, 25)).toBe(2)
    expect(stageForElapsedMs('pino', 15 * 60_000, 25)).toBe(3)
    expect(stageForElapsedMs('pino', 25 * 60_000, 25)).toBe(4)
  })

  it('respeta la duración del roble', () => {
    expect(stageForElapsedMs('roble', 0, 60)).toBe(1)
    expect(stageForElapsedMs('roble', 10 * 60_000, 60)).toBe(2)
    expect(stageForElapsedMs('roble', 20 * 60_000, 60)).toBe(3)
    expect(stageForElapsedMs('roble', 30 * 60_000, 60)).toBe(4)
    expect(stageForElapsedMs('roble', 40 * 60_000, 60)).toBe(5)
    expect(stageForElapsedMs('roble', 50 * 60_000, 60)).toBe(6)
    expect(stageForElapsedMs('roble', 60 * 60_000, 60)).toBe(7)
  })

  it('no rompe con valores negativos', () => {
    expect(stageForElapsedMs('abedul', -1, 45)).toBe(1)
    expect(stageForElapsedMs('pino', -1, 25)).toBe(1)
    expect(stageForElapsedMs('roble', -1, 60)).toBe(1)
  })
})

describe('stageLabel', () => {
  it('devuelve la etiqueta de cada etapa del abedul', () => {
    expect(stageLabel('abedul', 1)).toBe('Brote')
    expect(stageLabel('abedul', 2)).toBe('Plantín')
    expect(stageLabel('abedul', 3)).toBe('Joven')
    expect(stageLabel('abedul', 4)).toBe('Maduro')
    expect(stageLabel('abedul', 5)).toBe('Adulto')
  })

  it('devuelve la etiqueta de cada etapa del pino', () => {
    expect(stageLabel('pino', 1)).toBe('Brote')
    expect(stageLabel('pino', 2)).toBe('Joven')
    expect(stageLabel('pino', 3)).toBe('Maduro')
    expect(stageLabel('pino', 4)).toBe('Adulto')
  })

  it('devuelve la etiqueta de cada etapa del roble', () => {
    expect(stageLabel('roble', 1)).toBe('Brote')
    expect(stageLabel('roble', 2)).toBe('Plantín')
    expect(stageLabel('roble', 3)).toBe('Joven')
    expect(stageLabel('roble', 4)).toBe('Maduro')
    expect(stageLabel('roble', 5)).toBe('Grande')
    expect(stageLabel('roble', 6)).toBe('Muy Grande')
    expect(stageLabel('roble', 7)).toBe('Adulto')
  })
})
