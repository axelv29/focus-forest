import { describe, expect, it } from 'vitest'
import { treeFrameName } from '@/render/sprites'
import type { TreeStage } from '@/state/types'

describe('treeFrameName', () => {
  it('asigna un frame vivo y uno marchito a cada etapa del abedul', () => {
    for (const stage of [1, 2, 3, 4, 5] as TreeStage[]) {
      expect(treeFrameName('abedul', stage, 'mature')).toBe(`abedul.${stage}.mature`)
      expect(treeFrameName('abedul', stage, 'withered')).toBe(`abedul.${stage}.withered`)
    }
  })

  it('asigna un frame vivo y uno marchito a cada etapa del pino', () => {
    for (const stage of [1, 2, 3, 4] as TreeStage[]) {
      expect(treeFrameName('pino', stage, 'mature')).toBe(`pino.${stage}.mature`)
      expect(treeFrameName('pino', stage, 'withered')).toBe(`pino.${stage}.withered`)
    }
  })

  it('asigna un frame vivo y uno marchito a cada etapa del roble', () => {
    for (const stage of [1, 2, 3, 4, 5, 6, 7] as TreeStage[]) {
      expect(treeFrameName('roble', stage, 'mature')).toBe(`roble.${stage}.mature`)
      expect(treeFrameName('roble', stage, 'withered')).toBe(`roble.${stage}.withered`)
    }
  })

  it('asigna un frame vivo y uno marchito a cada etapa del ceibo', () => {
    for (const stage of [1, 2, 3, 4, 5, 6, 7] as TreeStage[]) {
      expect(treeFrameName('ceibo', stage, 'mature')).toBe(`ceibo.${stage}.mature`)
      expect(treeFrameName('ceibo', stage, 'withered')).toBe(`ceibo.${stage}.withered`)
    }
  })

  it('usa cinco frames marchitos distintos para el abedul', () => {
    const names = new Set(
      ([1, 2, 3, 4, 5] as TreeStage[]).map((stage) => treeFrameName('abedul', stage, 'withered')),
    )
    expect(names.size).toBe(5)
  })
})
