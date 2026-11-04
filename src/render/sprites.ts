import type { TreeStage, TreeState } from '@/state/types'

export interface AtlasFrame {
  x: number
  y: number
  w: number
  h: number
  anchorX: number
  anchorY: number
  sheet: SheetName
}

export type SheetName = 'alive' | 'withered'

export interface Atlas {
  images: Record<SheetName, HTMLImageElement>
  frames: Record<string, AtlasFrame>
}

/** Los dos atlas están en `public/sprites/`; si faltan, se usan placeholders. */
export const SPRITES_ENABLED = true

/** Tile de pasto: solo se usa su cara superior de 64×32. */
export const GROUND_TILE_URL = '/sprites/pastosprite.png'

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

interface RawFrame {
  x: number
  y: number
  w: number
  h: number
  anchor?: [number, number]
}

const SHEETS = {
  alive: {
    image: '/sprites/pino_atlas.png',
    meta: '/sprites/pino_atlas.json',
    prefix: /^pino_([1-4])_/,
  },
  withered: {
    image: '/sprites/pino_muerto_atlas.png',
    meta: '/sprites/pino_muerto_atlas.json',
    prefix: /^pino_muerto_([1-4])_/,
  },
} as const

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
    image.src = url
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRawFrame(value: unknown): value is RawFrame {
  if (!isRecord(value)) {
    return false
  }

  const hasBox = ['x', 'y', 'w', 'h'].every((key) => typeof value[key] === 'number')
  const anchor = value.anchor
  const hasAnchor =
    anchor === undefined ||
    (Array.isArray(anchor) &&
      anchor.length === 2 &&
      anchor.every((coordinate) => typeof coordinate === 'number'))

  return hasBox && hasAnchor
}

async function loadSheet(sheet: SheetName): Promise<{
  sheet: SheetName
  image: HTMLImageElement
  frames: Record<string, RawFrame>
}> {
  const config = SHEETS[sheet]
  const [response, image] = await Promise.all([fetch(config.meta), loadImage(config.image)])
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${config.meta}`)
  }

  const raw = (await response.json()) as unknown
  const frames = isRecord(raw) && isRecord(raw.frames) ? raw.frames : raw
  if (!isRecord(frames)) {
    throw new Error(`Formato inválido en ${config.meta}`)
  }

  return { sheet, image, frames: frames as Record<string, RawFrame> }
}

/**
 * Carga los dos atlas y los normaliza a los nombres que usa el render.
 * Si falta un archivo o un frame, devuelve null y se usan los placeholders.
 */
export async function loadAtlas(): Promise<Atlas | null> {
  try {
    const [alive, withered] = await Promise.all([loadSheet('alive'), loadSheet('withered')])
    const frames: Record<string, AtlasFrame> = {}

    for (const source of [alive, withered]) {
      for (const [sourceName, raw] of Object.entries(source.frames)) {
        if (!isRawFrame(raw)) {
          continue
        }

        const match = sourceName.match(SHEETS[source.sheet].prefix)
        if (!match) {
          continue
        }

        const stage = Number(match[1]) as TreeStage
        const frameName = treeFrameName(stage, source.sheet === 'alive' ? 'mature' : 'withered')
        frames[frameName] = {
          x: raw.x,
          y: raw.y,
          w: raw.w,
          h: raw.h,
          anchorX: raw.anchor?.[0] ?? raw.w / 2,
          anchorY: raw.anchor?.[1] ?? raw.h,
          sheet: source.sheet,
        }
      }
    }

    if (Object.keys(frames).length < 8) {
      return null
    }

    return { images: { alive: alive.image, withered: withered.image }, frames }
  } catch {
    return null
  }
}

/** Carga el tile de pasto. Si falla, el render vuelve a la grilla procedural. */
export async function loadGroundTile(): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(GROUND_TILE_URL)
  } catch {
    return null
  }
}

/**
 * Dibuja un frame a su tamaño nativo, anclado abajo al centro por defecto.
 * `baseX` y `baseY` son el punto de apoyo del árbol en la escena.
 */
export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  name: string,
  baseX: number,
  baseY: number,
): boolean {
  const frame = atlas.frames[name]
  if (!frame) {
    return false
  }

  ctx.drawImage(
    atlas.images[frame.sheet],
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    baseX - frame.anchorX,
    baseY - frame.anchorY,
    frame.w,
    frame.h,
  )
  return true
}
