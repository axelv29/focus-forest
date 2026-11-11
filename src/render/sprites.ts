import { GRID_COLS } from '@/config/grid'
import type { TreeSpecies, TreeStage, TreeState } from '@/state/types'

export interface AtlasFrame {
  x: number
  y: number
  w: number
  h: number
  anchorX: number
  anchorY: number
  sheet: SheetName
}

export type SheetName =
  | 'pino'
  | 'pinoMuerto'
  | 'abedul'
  | 'abedulMuerto'
  | 'roble'
  | 'robleMuerto'

export interface Atlas {
  images: Partial<Record<SheetName, HTMLImageElement>>
  frames: Record<string, AtlasFrame>
}

/** Los atlas están en `public/sprites/`; si faltan, se usan placeholders. */
export const SPRITES_ENABLED = true

/** Suelo completo 8×8, a su tamaño nativo (sin escalar). */
export const GROUND_TILE_URL = '/sprites/tileset8x8.png?v=4'

/** Tamaños de bosque con su propio sheet de suelo en `public/sprites/`. */
export const GROUND_TILE_SIZES = [4, 5, 6, 7, 8] as const

/**
 * URL del sheet de suelo para un bosque de `size` celdas por lado.
 * Todos los sheets miden 487×270 y comparten anclaje (rombo abajo-centro).
 */
export function groundTileUrl(size: number): string {
  return size === GRID_COLS ? GROUND_TILE_URL : `/sprites/tileset${size}x${size}.png?v=1`
}

/** Clave interna de un frame: especie, etapa y estado. */
export function treeFrameName(species: TreeSpecies, stage: TreeStage, state: TreeState): string {
  return `${species}.${stage}.${state}`
}

interface RawFrame {
  x: number
  y: number
  w: number
  h: number
  anchor?: [number, number]
}

interface SheetConfig {
  species: TreeSpecies
  state: TreeState
  image: string
  meta: string
  prefix: RegExp
  /** Escala de dibujo propia de la hoja; pisa la escala de la especie. */
  scale?: number
}

const SHEETS: Record<SheetName, SheetConfig> = {
  pino: {
    species: 'pino',
    state: 'mature',
    image: '/sprites/pino_atlas.png',
    meta: '/sprites/pino_atlas.json',
    prefix: /^pino_([1-5])_/,
  },
  pinoMuerto: {
    species: 'pino',
    state: 'withered',
    image: '/sprites/pino_muerto_atlas.png',
    meta: '/sprites/pino_muerto_atlas.json',
    prefix: /^pino_muerto_([1-5])_/,
  },
  abedul: {
    species: 'abedul',
    state: 'mature',
    image: '/sprites/abedul_vivo_atlas.png?v=4',
    meta: '/sprites/abedul_vivo_atlas.json?v=4',
    prefix: /^abedul_([1-5])_/,
  },
  abedulMuerto: {
    species: 'abedul',
    state: 'withered',
    image: '/sprites/abedul_muerto_downscale_atlas.png?v=4',
    meta: '/sprites/abedul_muerto_downscale_atlas.json?v=4',
    prefix: /^abedul_muerto_([1-5])_/,
  },
  roble: {
    species: 'roble',
    state: 'mature',
    image: '/sprites/robles_atlas.png?v=3',
    meta: '/sprites/robles_atlas.json?v=3',
    prefix: /^roble_([1-7])_/,
  },
  robleMuerto: {
    species: 'roble',
    state: 'withered',
    image: '/sprites/roble_muerto_atlas.png?v=1',
    meta: '/sprites/roble_muerto_atlas.json?v=1',
    prefix: /^roble_muerto_([1-7])_/,
  },
}

/** Escala de dibujo de una hoja; 1 salvo que la config diga lo contrario. */
export function sheetScale(sheet: SheetName): number {
  return SHEETS[sheet].scale ?? 1
}

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

let atlasPromise: Promise<Atlas | null> | null = null

/**
 * Carga los atlas una sola vez y los normaliza a los nombres que usa el
 * render. Si falta el atlas del pino, devuelve null y se usan placeholders;
 * las demás especies se agregan cuando están disponibles.
 */
export function loadAtlas(): Promise<Atlas | null> {
  atlasPromise ??= loadAtlasOnce()
  return atlasPromise
}

async function loadAtlasOnce(): Promise<Atlas | null> {
  const sheetNames = Object.keys(SHEETS) as SheetName[]
  const results = await Promise.allSettled(sheetNames.map((sheet) => loadSheet(sheet)))
  const frames: Record<string, AtlasFrame> = {}
  const images: Partial<Record<SheetName, HTMLImageElement>> = {}
  let pinoFrames = 0

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      continue
    }

    const source = result.value
    const config = SHEETS[source.sheet]
    images[source.sheet] = source.image

    for (const [sourceName, raw] of Object.entries(source.frames)) {
      if (!isRawFrame(raw)) {
        continue
      }

      const match = sourceName.match(config.prefix)
      if (!match) {
        continue
      }

      const stage = Number(match[1]) as TreeStage
      frames[treeFrameName(config.species, stage, config.state)] = {
        x: raw.x,
        y: raw.y,
        w: raw.w,
        h: raw.h,
        anchorX: raw.anchor?.[0] ?? raw.w / 2,
        anchorY: raw.anchor?.[1] ?? raw.h,
        sheet: source.sheet,
      }

      if (config.species === 'pino') {
        pinoFrames += 1
      }
    }
  }

  if (pinoFrames < 4) {
    return null
  }

  return { images, frames }
}

/** Carga el suelo del tamaño pedido. Si falla, el render vuelve a la grilla procedural. */
export async function loadGroundTile(size: number = GRID_COLS): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(groundTileUrl(size))
  } catch {
    return null
  }
}

/**
 * Dibuja un frame anclado abajo al centro. `scale` adapta el arte de cada
 * especie al tamaño de la pradera. `baseX` y `baseY` son el punto de apoyo
 * del árbol en la escena.
 */
export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  name: string,
  baseX: number,
  baseY: number,
  scale = 1,
): boolean {
  const frame = atlas.frames[name]
  const image = frame ? atlas.images[frame.sheet] : undefined
  if (!frame || !image) {
    return false
  }

  ctx.drawImage(
    image,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    baseX - frame.anchorX * scale,
    baseY - frame.anchorY * scale,
    frame.w * scale,
    frame.h * scale,
  )
  return true
}
