import {
  GRID_COLS,
  ISLAND_DEPTH,
  ORIGIN_X,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TILE_HEIGHT,
  TILE_WIDTH,
  TOP_PADDING,
} from '@/config/grid'
import { speciesConfig, speciesFromKind } from '@/config/species'
import type { Cell, Tree, TreeSpecies, TreeStage, TreeState } from '@/state/types'
import { cellToScreen, sortByDepth } from './iso'
import { drawAtlasFrame, sheetScale, treeFrameName, type Atlas } from './sprites'

export interface ActiveTreePreview {
  cell: Cell
  species: TreeSpecies
  stage: TreeStage
  /** Sesión activa cuyo árbol crece; permite incluirlo en la selección. */
  sessionId?: string | null
}

export interface DrawGardenOptions {
  trees: readonly Tree[]
  active?: ActiveTreePreview | null
  atlas?: Atlas | null
  groundTile?: HTMLImageElement | null
  /** Tamaño del bosque en celdas por lado (preview del panel dev). Por defecto 8×8. */
  gardenSize?: number
  /** Sesiones resaltadas: sus árboles se ven enteros y el resto se atenúa. */
  selectedSessionIds?: ReadonlySet<string> | null
}

interface DrawableTree {
  cell: Cell
  species: TreeSpecies
  stage: TreeStage
  state: TreeState
  sessionId: string | null
  selected: boolean
}

const STAGE_SCALE: Record<TreeStage, number> = {
  1: 0.38,
  2: 0.55,
  3: 0.78,
  4: 1,
  5: 1,
  6: 1,
  7: 1,
}

/**
 * Anclaje del sheet de suelo: el vértice superior del rombo 8×8 cae en
 * (243.5, 5) de la imagen. Todos los tilesets por tamaño (4×4…8×8) miden
 * 487×270 y comparten ese anclaje, así que se dibujan enteros, sin recorte.
 */
const GROUND_SHEET_TOP_X = 243.5
const GROUND_SHEET_TOP_Y = 5

export function drawGarden(ctx: CanvasRenderingContext2D, options: DrawGardenOptions): void {
  const size = Math.min(GRID_COLS, Math.max(1, Math.round(options.gardenSize ?? GRID_COLS)))
  // El rombo más chico se ancla abajo: la punta baja (8 − size) filas.
  const meadowTop = TOP_PADDING + (GRID_COLS - size) * TILE_HEIGHT
  const pixelWidth = ctx.canvas.width
  const pixelHeight = ctx.canvas.height
  // El canvas ya tiene el tamaño exacto de la escena a una escala entera.
  // La escena es siempre 480×400: cada sheet por tamaño trae su isla
  // anclada abajo-centro en el mismo lienzo de 487×270.
  const scale = Math.min(pixelWidth / SCENE_WIDTH, pixelHeight / SCENE_HEIGHT)
  const offsetX = Math.round((pixelWidth - SCENE_WIDTH * scale) / 2)
  const offsetY = Math.round((pixelHeight - SCENE_HEIGHT * scale) / 2)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, pixelWidth, pixelHeight)
  ctx.imageSmoothingEnabled = false
  ctx.imageSmoothingQuality = 'high'

  if (options.groundTile) {
    drawGroundSheet(ctx, options.groundTile, scale, offsetX, offsetY)
  } else {
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)
    drawIsland(ctx, size, meadowTop)
    drawGrid(ctx, size, meadowTop)
  }

  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)

  const meadowShift = meadowTop - TOP_PADDING
  const selected = options.selectedSessionIds ?? null
  const trees: DrawableTree[] = options.trees
    .filter((tree) => isInsideGarden(tree.cell, size))
    .map((tree) => ({
      cell: tree.cell,
      species: speciesFromKind(tree.kind),
      stage: tree.stage,
      state: tree.state,
      sessionId: tree.sessionId,
      selected: selected?.has(tree.sessionId) ?? false,
    }))

  if (options.active && isInsideGarden(options.active.cell, size)) {
    const activeId = options.active.sessionId ?? null
    trees.push({
      cell: options.active.cell,
      species: options.active.species,
      stage: options.active.stage,
      state: 'mature',
      sessionId: activeId,
      selected: activeId !== null && selected?.has(activeId) === true,
    })
  }

  const ordered = sortByDepth(trees)
  const hasSelection = ordered.some((tree) => tree.selected)

  // Con una sesión seleccionada, sus árboles se dibujan al final y a opacidad
  // completa; el resto queda detrás y atenuado para poder leer el conjunto.
  if (hasSelection) {
    for (const tree of ordered) {
      if (tree.selected) {
        continue
      }
      ctx.save()
      ctx.globalAlpha = 0.32
      drawTree(ctx, tree, options.atlas ?? null, meadowShift)
      ctx.restore()
    }
    for (const tree of ordered) {
      if (tree.selected) {
        drawTree(ctx, tree, options.atlas ?? null, meadowShift)
      }
    }
    return
  }

  for (const tree of ordered) {
    drawTree(ctx, tree, options.atlas ?? null, meadowShift)
  }
}

/** Base de un árbol en coordenadas de escena, compartida con el hit-test. */
export function treeBasePoint(cell: Cell, gardenSize: number): { x: number; baseY: number } {
  const size = Math.min(GRID_COLS, Math.max(1, Math.round(gardenSize)))
  const meadowShift = (GRID_COLS - size) * TILE_HEIGHT
  const point = cellToScreen(cell)

  return { x: point.x, baseY: point.y + meadowShift + 4 }
}

/** Los árboles fuera del bosque elegido no se dibujan en la preview. */
function isInsideGarden(cell: Cell, size: number): boolean {
  return cell.col >= 0 && cell.col < size && cell.row >= 0 && cell.row < size
}

function drawIsland(ctx: CanvasRenderingContext2D, size: number, meadowTop: number): void {
  const topY = meadowTop
  // La base inferior queda siempre en la misma fila (368), igual que en los
  // sheets: los bosques más chicos se anclan abajo.
  const bottomY = meadowTop + size * TILE_HEIGHT
  const middleY = (topY + bottomY) / 2
  const centerX = ORIGIN_X
  const leftX = ORIGIN_X - (size * TILE_WIDTH) / 2
  const rightX = ORIGIN_X + (size * TILE_WIDTH) / 2

  // Cara izquierda de la tierra.
  ctx.fillStyle = '#8b644a'
  polygon(ctx, [
    [leftX, middleY],
    [centerX, bottomY],
    [centerX, bottomY + ISLAND_DEPTH],
    [leftX, middleY + ISLAND_DEPTH],
  ])
  ctx.fill()

  // Cara derecha, en sombra.
  ctx.fillStyle = '#6b4a36'
  polygon(ctx, [
    [centerX, bottomY],
    [rightX, middleY],
    [rightX, middleY + ISLAND_DEPTH],
    [centerX, bottomY + ISLAND_DEPTH],
  ])
  ctx.fill()

  // Superficie de pasto.
  ctx.fillStyle = '#4d9a50'
  polygon(ctx, [
    [centerX, topY],
    [rightX, middleY],
    [centerX, bottomY],
    [leftX, middleY],
  ])
  ctx.fill()
}

/** Dibuja el sheet de suelo completo del tamaño elegido, sin recortar. */
function drawGroundSheet(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  scale: number,
  offsetX: number,
  offsetY: number,
): void {
  const x = offsetX + (ORIGIN_X - GROUND_SHEET_TOP_X) * scale
  const y = offsetY + (TOP_PADDING - GROUND_SHEET_TOP_Y) * scale

  // Dibujar en píxeles físicos con traslación entera evita el shimmer al hacer zoom.
  ctx.drawImage(image, Math.round(x), Math.round(y), image.width * scale, image.height * scale)
}

function drawGrid(ctx: CanvasRenderingContext2D, size: number, meadowTop: number): void {
  ctx.strokeStyle = 'rgba(32, 63, 59, 0.26)'
  ctx.lineWidth = 1.25

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const x = ORIGIN_X + (col - row) * (TILE_WIDTH / 2)
      const y = meadowTop + (col + row) * (TILE_HEIGHT / 2) + TILE_HEIGHT / 2

      ctx.beginPath()
      ctx.moveTo(x, y - TILE_HEIGHT / 2)
      ctx.lineTo(x + TILE_WIDTH / 2, y)
      ctx.lineTo(x, y + TILE_HEIGHT / 2)
      ctx.lineTo(x - TILE_WIDTH / 2, y)
      ctx.closePath()

      ctx.fillStyle = (col + row) % 2 === 0 ? '#8db65d' : '#85ab56'
      ctx.fill()
      ctx.stroke()
    }
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  tree: DrawableTree,
  atlas: Atlas | null,
  meadowShift: number,
): void {
  const { x, y } = cellToScreen(tree.cell)
  // En bosques más chicos la pradera entera baja (8 − size) filas.
  const groundY = y + meadowShift
  const baseY = groundY + 4

  // Los atlas incluyen la sombra pixelada, vivos y marchitos.
  if (atlas) {
    const frameName = treeFrameName(tree.species, tree.stage, tree.state)
    const frame = atlas.frames[frameName]
    const frameScale = frame ? sheetScale(frame.sheet) : speciesConfig(tree.species).scale
    if (drawAtlasFrame(ctx, atlas, frameName, x, baseY, frameScale)) {
      return
    }
  }

  // Sombra procedural solo para los placeholders.
  const shadowScale = STAGE_SCALE[tree.stage]

  ctx.save()
  ctx.fillStyle = 'rgba(32, 63, 59, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, groundY, 20 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  if (tree.state === 'withered') {
    drawWithered(ctx, x, baseY, tree.stage)
  } else {
    drawPine(ctx, x, baseY, tree.stage)
  }
}

function drawPine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  stage: TreeStage,
): void {
  const scale = STAGE_SCALE[stage]

  ctx.save()
  ctx.translate(cx, baseY)
  ctx.scale(scale, scale)
  ctx.lineJoin = 'miter'
  ctx.lineWidth = 2

  // Tronco.
  ctx.fillStyle = '#554736'
  ctx.strokeStyle = '#203f3b'
  ctx.beginPath()
  ctx.rect(-4, -22, 8, 22)
  ctx.fill()
  ctx.stroke()

  // Tres capas de follaje, de oscuro a claro.
  const layers = [
    { bottom: -14, half: 28, top: -56, fill: '#2f5a45' },
    { bottom: -40, half: 24, top: -82, fill: '#3a684f' },
    { bottom: -64, half: 19, top: -108, fill: '#548952' },
  ] as const

  for (const layer of layers) {
    ctx.beginPath()
    ctx.moveTo(-layer.half, layer.bottom)
    ctx.lineTo(layer.half, layer.bottom)
    ctx.lineTo(0, layer.top)
    ctx.closePath()
    ctx.fillStyle = layer.fill
    ctx.fill()
    ctx.strokeStyle = '#203f3b'
    ctx.stroke()
  }

  ctx.restore()
}

function drawWithered(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  stage: TreeStage,
): void {
  const scale = 0.9 * STAGE_SCALE[stage]

  ctx.save()
  ctx.translate(cx, baseY)
  ctx.scale(scale, scale)
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'

  // Tronco principal, un poco torcido.
  ctx.strokeStyle = '#6b4a36'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-2, -34)
  ctx.lineTo(1, -68)
  ctx.lineTo(0, -88)
  ctx.stroke()

  // Ramas secas.
  ctx.strokeStyle = '#554736'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-1, -24)
  ctx.lineTo(-18, -38)
  ctx.moveTo(0, -38)
  ctx.lineTo(16, -52)
  ctx.moveTo(0, -52)
  ctx.lineTo(-16, -66)
  ctx.moveTo(0, -64)
  ctx.lineTo(12, -78)
  ctx.moveTo(0, -76)
  ctx.lineTo(-7, -86)
  ctx.stroke()

  // Ramitas finas en las puntas.
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-18, -38)
  ctx.lineTo(-26, -46)
  ctx.moveTo(-18, -38)
  ctx.lineTo(-21, -30)
  ctx.moveTo(16, -52)
  ctx.lineTo(24, -60)
  ctx.moveTo(16, -52)
  ctx.lineTo(20, -44)
  ctx.moveTo(-16, -66)
  ctx.lineTo(-24, -74)
  ctx.moveTo(12, -78)
  ctx.lineTo(18, -84)
  ctx.stroke()

  // Base.
  ctx.fillStyle = '#6b4a36'
  ctx.fillRect(-4, -7, 8, 7)

  ctx.restore()
}

function polygon(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
): void {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1])
  }

  ctx.closePath()
}
