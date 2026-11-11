import { useEffect, useMemo, useRef } from 'react'
import {
  GRID_COLS,
  ORIGIN_X,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TILE_HEIGHT,
  TILE_WIDTH,
  TOP_PADDING,
} from '@/config/grid'
import type { ForestSize } from '@/config/forest'
import type { Tree, TreeSpecies, TreeStage } from '@/state/types'
import { drawGarden } from '@/render/drawGarden'
import { loadAtlas, loadGroundTile } from '@/render/sprites'

interface ForestPreviewCanvasProps {
  size: ForestSize
  /** Árboles reales del bosque. Si se omite, se muestra un layout de ejemplo. */
  trees?: readonly Tree[]
  /** Fuerza el layout de ejemplo aunque se pasen árboles (útil para el diálogo de creación). */
  example?: boolean
  className?: string
}

/** Etapa adulta de cada especie: la última de su escalera de crecimiento. */
const ADULT_STAGE: Record<TreeSpecies, TreeStage> = {
  pino: 4,
  abedul: 5,
  roble: 7,
  ceibo: 7,
}

interface PreviewExample {
  species: TreeSpecies
  cell: { col: number; row: number }
}

/**
 * Árboles de muestra para la vista previa: todos adultos y colocados de forma
 * natural (sin simetría) para que se entienda la progresión de especies.
 * Las posiciones cambian con el tamaño, no con el contenido real del bosque.
 */
const PREVIEW_LAYOUTS: Record<ForestSize, readonly PreviewExample[]> = {
  // 4×4: tres pinos y un abedul.
  4: [
    { species: 'pino', cell: { col: 0, row: 1 } },
    { species: 'pino', cell: { col: 2, row: 3 } },
    { species: 'pino', cell: { col: 3, row: 1 } },
    { species: 'abedul', cell: { col: 1, row: 2 } },
  ],
  // 5×5: se suma un roble.
  5: [
    { species: 'pino', cell: { col: 0, row: 1 } },
    { species: 'pino', cell: { col: 2, row: 3 } },
    { species: 'pino', cell: { col: 4, row: 1 } },
    { species: 'abedul', cell: { col: 1, row: 2 } },
    { species: 'roble', cell: { col: 3, row: 4 } },
  ],
  // 6×6: más abedules.
  6: [
    { species: 'pino', cell: { col: 0, row: 1 } },
    { species: 'pino', cell: { col: 2, row: 4 } },
    { species: 'pino', cell: { col: 5, row: 1 } },
    { species: 'abedul', cell: { col: 1, row: 3 } },
    { species: 'abedul', cell: { col: 4, row: 5 } },
    { species: 'roble', cell: { col: 3, row: 2 } },
  ],
  // 7×7: segundo roble.
  7: [
    { species: 'pino', cell: { col: 0, row: 1 } },
    { species: 'pino', cell: { col: 2, row: 4 } },
    { species: 'pino', cell: { col: 5, row: 0 } },
    { species: 'abedul', cell: { col: 1, row: 3 } },
    { species: 'abedul', cell: { col: 6, row: 2 } },
    { species: 'roble', cell: { col: 3, row: 5 } },
    { species: 'roble', cell: { col: 5, row: 4 } },
  ],
  // 8×8: un ceibo, el más raro, cerrando la progresión.
  8: [
    { species: 'pino', cell: { col: 0, row: 5 } },
    { species: 'pino', cell: { col: 2, row: 4 } },
    { species: 'pino', cell: { col: 5, row: 0 } },
    { species: 'abedul', cell: { col: 1, row: 4 } },
    { species: 'abedul', cell: { col: 6, row: 2 } },
    { species: 'roble', cell: { col: 5, row: 3 } },
    { species: 'ceibo', cell: { col: 2, row: 2 } },
  ],
}

function previewTrees(size: ForestSize): Tree[] {
  return PREVIEW_LAYOUTS[size].map((example, index) => ({
    id: `preview-${index}`,
    forestId: 'preview',
    sessionId: `preview-session-${index}`,
    cell: { ...example.cell },
    kind: example.species,
    stage: ADULT_STAGE[example.species],
    state: 'mature',
    createdAt: index,
  }))
}

/** Miniatura real del bosque: mismo atlas y mismo suelo que la pradera. */
export function ForestPreviewCanvas({
  size,
  trees,
  example = false,
  className,
}: ForestPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cancelledRef = useRef(false)
  const useExample = example || trees === undefined
  const displayTrees = useMemo(
    () => (useExample ? previewTrees(size) : [...(trees ?? [])]),
    [useExample, trees, size],
  )

  useEffect(() => {
    cancelledRef.current = false
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    void Promise.all([loadAtlas(), loadGroundTile(size)]).then(([atlas, groundTile]) => {
      if (cancelledRef.current) {
        return
      }

      // La escena completa tiene mucho cielo arriba. Para la miniatura se
      // dibuja en un lienzo aparte y se recorta la isla con un margen para
      // que los árboles se vean grandes y reconocibles.
      const scene = document.createElement('canvas')
      scene.width = SCENE_WIDTH
      scene.height = SCENE_HEIGHT
      const sceneContext = scene.getContext('2d')
      if (!sceneContext) {
        return
      }

      drawGarden(sceneContext, {
        trees: displayTrees,
        atlas: atlas ?? undefined,
        groundTile: groundTile ?? undefined,
        gardenSize: size,
      })

      const meadowTop = TOP_PADDING + (GRID_COLS - size) * TILE_HEIGHT
      const cropX = Math.max(0, ORIGIN_X - (size * TILE_WIDTH) / 2 - 18)
      const cropY = Math.max(0, meadowTop - 92)
      const cropWidth = Math.min(SCENE_WIDTH, size * TILE_WIDTH + 36)
      const cropHeight = SCENE_HEIGHT - cropY

      // Buffer 1:1 del recorte para que el escalado CSS (pixelated) sea nítido.
      if (canvas.width !== cropWidth || canvas.height !== cropHeight) {
        canvas.width = cropWidth
        canvas.height = cropHeight
      }

      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(scene, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    })

    return () => {
      cancelledRef.current = true
    }
  }, [size, displayTrees])

  return (
    <canvas
      ref={canvasRef}
      className={className ? `forest-preview-canvas ${className}` : 'forest-preview-canvas'}
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      role="img"
      aria-label={
        useExample
          ? `Vista previa de ejemplo de un bosque de ${size} por ${size}`
          : `Vista previa del bosque de ${size} por ${size}`
      }
    />
  )
}
