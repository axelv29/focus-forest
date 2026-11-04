import {
  CANVAS_OVERSCAN,
  GRID_COLS,
  GRID_PIXEL_HEIGHT,
  GRID_ROWS,
  ISLAND_DEPTH,
  ORIGIN_X,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TILE_HEIGHT,
  TILE_WIDTH,
  TOP_PADDING,
} from '@/config/grid'
import { clampZoom } from '@/logic/zoom'
import type { Cell, Tree, TreeStage, TreeState } from '@/state/types'
import { cellToScreen, sortByDepth } from './iso'
import { drawAtlasFrame, treeFrameName, type Atlas } from './sprites'

export interface ActiveTreePreview {
  cell: Cell
  stage: TreeStage
}

export interface DrawGardenOptions {
  trees: readonly Tree[]
  active?: ActiveTreePreview | null
  atlas?: Atlas | null
  zoom?: number
}

interface DrawableTree {
  cell: Cell
  stage: TreeStage
  state: TreeState
}

const STAGE_SCALE: Record<TreeStage, number> = {
  1: 0.38,
  2: 0.55,
  3: 0.78,
  4: 1,
}

export function drawGarden(ctx: CanvasRenderingContext2D, options: DrawGardenOptions): void {
  const pixelWidth = ctx.canvas.width
  const pixelHeight = ctx.canvas.height
  const baseScale = Math.min(
    pixelWidth / (SCENE_WIDTH * CANVAS_OVERSCAN),
    pixelHeight / (SCENE_HEIGHT * CANVAS_OVERSCAN),
  )
  const scale = baseScale * clampZoom(options.zoom ?? 1)
  const offsetX = (pixelWidth - SCENE_WIDTH * scale) / 2
  const offsetY = (pixelHeight - SCENE_HEIGHT * scale) / 2

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, pixelWidth, pixelHeight)
  ctx.imageSmoothingEnabled = false
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)

  drawIsland(ctx)
  drawGrid(ctx)
  drawIslandEdge(ctx)

  const trees: DrawableTree[] = options.trees.map((tree) => ({
    cell: tree.cell,
    stage: tree.stage,
    state: tree.state,
  }))

  if (options.active) {
    trees.push({ cell: options.active.cell, stage: options.active.stage, state: 'mature' })
  }

  for (const tree of sortByDepth(trees)) {
    drawTree(ctx, tree, options.atlas ?? null)
  }
}

function drawIsland(ctx: CanvasRenderingContext2D): void {
  const topY = TOP_PADDING
  const middleY = TOP_PADDING + GRID_PIXEL_HEIGHT / 2
  const bottomY = TOP_PADDING + GRID_PIXEL_HEIGHT
  const centerX = ORIGIN_X
  const leftX = 0
  const rightX = SCENE_WIDTH

  ctx.lineJoin = 'miter'
  ctx.lineWidth = 2
  ctx.strokeStyle = '#554736'

  // Cara izquierda de la tierra.
  ctx.fillStyle = '#8b644a'
  polygon(ctx, [
    [leftX, middleY],
    [centerX, bottomY],
    [centerX, bottomY + ISLAND_DEPTH],
    [leftX, middleY + ISLAND_DEPTH],
  ])
  ctx.fill()
  ctx.stroke()

  // Cara derecha, en sombra.
  ctx.fillStyle = '#6b4a36'
  polygon(ctx, [
    [centerX, bottomY],
    [rightX, middleY],
    [rightX, middleY + ISLAND_DEPTH],
    [centerX, bottomY + ISLAND_DEPTH],
  ])
  ctx.fill()
  ctx.stroke()

  // Superficie de pasto.
  ctx.fillStyle = '#8db65d'
  polygon(ctx, [
    [centerX, topY],
    [rightX, middleY],
    [centerX, bottomY],
    [leftX, middleY],
  ])
  ctx.fill()
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(32, 63, 59, 0.26)'
  ctx.lineWidth = 1.25

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const { x, y } = cellToScreen({ col, row })

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

  ctx.restore()
}

function drawIslandEdge(ctx: CanvasRenderingContext2D): void {
  const topY = TOP_PADDING
  const middleY = TOP_PADDING + GRID_PIXEL_HEIGHT / 2
  const bottomY = TOP_PADDING + GRID_PIXEL_HEIGHT

  ctx.strokeStyle = '#3a684f'
  ctx.lineWidth = 3
  ctx.lineJoin = 'miter'
  polygon(ctx, [
    [ORIGIN_X, topY],
    [SCENE_WIDTH, middleY],
    [ORIGIN_X, bottomY],
    [0, middleY],
  ])
  ctx.stroke()
}

function drawTree(ctx: CanvasRenderingContext2D, tree: DrawableTree, atlas: Atlas | null): void {
  const { x, y } = cellToScreen(tree.cell)
  const baseY = y + 4

  const shadowScale = STAGE_SCALE[tree.stage]

  ctx.save()
  ctx.fillStyle = 'rgba(32, 63, 59, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, baseY + 2, 20 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  if (atlas) {
    const frameName = treeFrameName(tree.stage, tree.state)
    if (drawAtlasFrame(ctx, atlas, frameName, x, baseY)) {
      return
    }
  }

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
