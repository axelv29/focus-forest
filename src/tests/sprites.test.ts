import { describe, expect, it } from 'vitest'
import { TREE_STAGE_FRAME_NAMES, treeFrameName } from '@/render/sprites'
import type { TreeStage } from '@/state/types'

describe('treeFrameName', () => {
  it('asigna un frame vivo y uno marchito a cada etapa', () => {
    for (const stage of [1, 2, 3, 4] as TreeStage[]) {
      expect(treeFrameName(stage, 'mature')).toBe(TREE_STAGE_FRAME_NAMES[stage])
      expect(treeFrameName(stage, 'withered')).toBe(`${TREE_STAGE_FRAME_NAMES[stage]}.withered`)
    }
  })

  it('usa cuatro frames marchitos distintos', () => {
    const names = new Set(
      ([1, 2, 3, 4] as TreeStage[]).map((stage) => treeFrameName(stage, 'withered')),
    )
    expect(names.size).toBe(4)
  })
})
