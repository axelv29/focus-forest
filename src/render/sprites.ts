import type { TreeStage, TreeState } from '@/state/types'

export interface AtlasFrame {
  x: number
  y: number
  w: number
  h: number
}

export interface Atlas {
  image: HTMLImageElement
  frames: Record<string, AtlasFrame>
}

/** Cambiar a true cuando existan `public/sprites/atlas.png` y `atlas.json`. */
export const SPRITES_ENABLED = false

/** Nombre base de cada etapa viva; la versión marchita agrega `.withered`. */
export const TREE_STAGE_FRAME_NAMES = {
  1: 'tree.brote',
  2: 'tree.joven',
  3: 'tree.maduro',
  4: 'tree.adulto',
} as const satisfies Record<TreeStage, string>

export function treeFrameName(stage: TreeStage, state: TreeState): string {
  const base = TREE_STAGE_FRAME_NAMES[stage]
  return state === 'withered' ? `${base}.withered` : base
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
    image.src = url
  })
}

/**
 * Carga el atlas opcional. Si los assets todavía no existen, devuelve null
 * y el render usa los árboles placeholder dibujados por código.
 */
export async function loadAtlas(
  imageUrl = '/sprites/atlas.png',
  metaUrl = '/sprites/atlas.json',
): Promise<Atlas | null> {
  try {
    const response = await fetch(metaUrl)
    if (!response.ok) {
      return null
    }

    const meta = (await response.json()) as { frames?: Record<string, AtlasFrame> }
    if (!meta.frames) {
      return null
    }

    const image = await loadImage(imageUrl)
    return { image, frames: meta.frames }
  } catch {
    return null
  }
}

export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  const frame = atlas.frames[name]
  if (!frame) {
    return false
  }

  ctx.drawImage(atlas.image, frame.x, frame.y, frame.w, frame.h, x, y, width, height)
  return true
}
