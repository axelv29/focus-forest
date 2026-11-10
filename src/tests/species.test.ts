import { describe, expect, it } from 'vitest'
import {
  availableFocusMinutes,
  finalStage,
  speciesForFocusMin,
  speciesFromKind,
  stageMinuteMark,
} from '@/config/species'

describe('speciesForFocusMin', () => {
  it.each([
    [10, 'pino'],
    [15, 'pino'],
    [20, 'pino'],
    [25, 'pino'],
    [44, 'pino'],
    [45, 'abedul'],
    [59, 'abedul'],
    [60, 'roble'],
    [120, 'roble'],
  ])('con %s minutos elige %s', (minutes, expected) => {
    expect(speciesForFocusMin(minutes)).toBe(expected)
  })
})

describe('availableFocusMinutes', () => {
  it('expone solo los bloques con una especie configurada', () => {
    expect(availableFocusMinutes()).toEqual([25, 45, 60])
  })
})

describe('speciesFromKind', () => {
  it('reconoce el abedul y el roble, y deja el pino como base', () => {
    expect(speciesFromKind('abedul')).toBe('abedul')
    expect(speciesFromKind('roble')).toBe('roble')
    expect(speciesFromKind('pino')).toBe('pino')
    expect(speciesFromKind(undefined)).toBe('pino')
  })
})

describe('finalStage', () => {
  it('termina en la última etapa de cada especie', () => {
    expect(finalStage('abedul')).toBe(5)
    expect(finalStage('pino')).toBe(4)
    expect(finalStage('roble')).toBe(7)
  })
})

describe('stageMinuteMark', () => {
  it('redondea los minutos de cada etapa del abedul', () => {
    expect(stageMinuteMark('abedul', 1, 45)).toBe(0)
    expect(stageMinuteMark('abedul', 2, 45)).toBe(11)
    expect(stageMinuteMark('abedul', 3, 45)).toBe(23)
    expect(stageMinuteMark('abedul', 4, 45)).toBe(34)
    expect(stageMinuteMark('abedul', 5, 45)).toBe(45)
  })

  it('redondea los minutos de cada etapa del roble', () => {
    expect(stageMinuteMark('roble', 1, 60)).toBe(0)
    expect(stageMinuteMark('roble', 2, 60)).toBe(10)
    expect(stageMinuteMark('roble', 3, 60)).toBe(20)
    expect(stageMinuteMark('roble', 4, 60)).toBe(30)
    expect(stageMinuteMark('roble', 5, 60)).toBe(40)
    expect(stageMinuteMark('roble', 6, 60)).toBe(50)
    expect(stageMinuteMark('roble', 7, 60)).toBe(60)
  })
})
