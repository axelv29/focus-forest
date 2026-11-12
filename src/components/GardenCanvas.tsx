import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  GRID_COLS,
  ISLAND_DEPTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TILE_HEIGHT,
  TOP_PADDING,
} from '@/config/grid'
import { DEFAULT_ZOOM, MAX_ZOOM } from '@/config/zoom'
import { cellFromScenePoint, sortByDepth } from '@/render/iso'
import { clampPan, panLimit, type PanOffset } from '@/logic/pan'
import {
  fitPixelScale,
  minPixelPerfectZoom,
  pixelPerfectZoom,
  snapPixelScale,
  stepPixelPerfectZoom,
  wheelZoomStep,
} from '@/logic/zoom'
import { drawGarden, treeBasePoint, type ActiveTreePreview } from '@/render/drawGarden'
import {
  atlasFrameBounds,
  GROUND_TILE_SIZES,
  loadAtlas,
  loadGroundTile,
  sheetScale,
  SPRITES_ENABLED,
  treeFrameName,
  type Atlas,
} from '@/render/sprites'
import { speciesFromKind } from '@/config/species'
import type { Cell, Tree } from '@/state/types'
import { MinusIcon, PineIcon, PlusIcon, ResetIcon } from './icons'

interface GardenCanvasProps {
  trees: readonly Tree[]
  active: ActiveTreePreview | null
  label: string
  /** Tamaño del bosque en celdas por lado; 8×8 por defecto. */
  gardenSize: number
  hasForest: boolean
  /** Sesiones resaltadas; null o vacío apaga el modo selección. */
  selectedSessionIds?: ReadonlySet<string> | null
  /** Cambia cuando se elige otra sesión, para recentrar una sola vez. */
  selectionKey?: string | null
  onSelectTree?: (tree: Tree | null) => void
}

interface TapState {
  time: number
  x: number
  y: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

const NO_DRAG_SELECTOR =
  'button, input, textarea, select, a, label, .zoom-control, .card, .dialog-backdrop, [role="dialog"], [role="button"], [contenteditable="true"], [data-no-pan]'

export function GardenCanvas({
  trees,
  active,
  label,
  gardenSize,
  hasForest,
  selectedSessionIds = null,
  selectionKey = null,
  onSelectTree,
}: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gardenRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const lastTapRef = useRef<TapState | null>(null)
  const centeredSelectionRef = useRef<string | null>(null)
  const panRef = useRef<PanOffset>({ x: 0, y: 0 })
  const wheelZoomRef = useRef(DEFAULT_ZOOM)
  const wheelAccumulatorRef = useRef(0)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [groundTiles, setGroundTiles] = useState<Record<number, HTMLImageElement | null>>({})
  // Se pinta el jardín solo cuando los sprites terminaron de cargar:
  // así no se ven los placeholders antes de tiempo.
  const [spritesReady, setSpritesReady] = useState(!SPRITES_ENABLED)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [panRatio, setPanRatio] = useState<PanOffset>({ x: 0, y: 0 })
  const [gardenBox, setGardenBox] = useState({ width: 0, height: 0 })
  const dpr = typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1)

  const hasGardenSize = gardenBox.width > 0 && gardenBox.height > 0
  // La escala base es la misma para todos los tamaños: el bosque de 8×8 llena
  // la escena y los más chicos se ven proporcionalmente más chicos. El zoom
  // queda disponible para acercarse a un bosque de 4×4.
  const meadowTop = TOP_PADDING + (GRID_COLS - gardenSize) * TILE_HEIGHT
  const idealBaseScale = hasGardenSize
    ? Math.min((gardenBox.width * dpr) / SCENE_WIDTH, (gardenBox.height * dpr) / SCENE_HEIGHT)
    : 1
  const basePixelScale = fitPixelScale(idealBaseScale)
  // No bajamos de 1:1 salvo que el propio contenedor sea más chico que la
  // escena. Así el zoom-out nunca pierde píxeles por muestreo.
  const minZoom = minPixelPerfectZoom(basePixelScale)
  const pixelScale = snapPixelScale(basePixelScale * zoom)
  // Margen horizontal escalado: el nuevo tileset tiene detalles de textura que
  // sobresalen ~1,5 px a la izquierda del diamante; con un margen fijo de 2 px
  // (no escalado) se recortaba al hacer zoom. Se escalan 4 px (2 por lado).
  const canvasWidth = Math.max(1, Math.round((SCENE_WIDTH + 4) * pixelScale))
  const canvasHeight = Math.max(1, Math.round(SCENE_HEIGHT * pixelScale))
  const canvasCssWidth = canvasWidth / dpr
  const canvasCssHeight = canvasHeight / dpr
  // Centra la isla del tamaño activo, no el lienzo de 8×8. Los bosques chicos
  // quedan anclados abajo en la escena y necesitan más desplazamiento.
  const islandCenterY = meadowTop + (gardenSize * TILE_HEIGHT + ISLAND_DEPTH) / 2
  const mapCenterOffsetY = ((islandCenterY - SCENE_HEIGHT / 2) * pixelScale) / dpr
  // El límite crece con el zoom y con el desborde real del canvas. Guardamos la
  // posición como fracción del límite para que al cambiar de zoom se mantenga
  // proporcional y no salte al volver a acercar.
  const panLimits = panLimit(
    zoom,
    canvasCssWidth,
    canvasCssHeight,
    gardenBox.width,
    gardenBox.height,
  )
  const pan = useMemo(
    () => ({
      x: Math.round(panRatio.x * panLimits.x),
      y: Math.round(panRatio.y * panLimits.y),
    }),
    [panRatio.x, panRatio.y, panLimits.x, panLimits.y],
  )

  const selectionFocus = useMemo<Cell | null>(() => {
    if (!selectedSessionIds || selectedSessionIds.size === 0) {
      return null
    }

    const selectedTrees = sortByDepth(
      trees.filter((tree) => selectedSessionIds.has(tree.sessionId)),
    )
    return selectedTrees[selectedTrees.length - 1]?.cell ?? null
  }, [trees, selectedSessionIds])

  useLayoutEffect(() => {
    if (!selectionKey || !selectionFocus || !hasGardenSize) {
      if (!selectionKey) {
        centeredSelectionRef.current = null
      }
      return
    }
    if (centeredSelectionRef.current === selectionKey) {
      return
    }

    centeredSelectionRef.current = selectionKey
    const base = treeBasePoint(selectionFocus, gardenSize)
    const cssPerScene = pixelScale / dpr
    const target = clampPan(
      {
        x: canvasCssWidth / 2 - base.x * cssPerScene,
        y: mapCenterOffsetY + canvasCssHeight / 2 - (base.baseY - 58) * cssPerScene,
      },
      panLimits,
    )

    setPanRatio({
      x: panLimits.x > 0 ? target.x / panLimits.x : 0,
      y: panLimits.y > 0 ? target.y / panLimits.y : 0,
    })
  }, [
    selectionKey,
    selectionFocus,
    hasGardenSize,
    gardenSize,
    pixelScale,
    dpr,
    canvasCssWidth,
    canvasCssHeight,
    mapCenterOffsetY,
    panLimits,
  ])

  // La tarjeta central queda visible hasta plantar el primer árbol: no se
  // oculta sola, porque es la única invitación a crear otro bosque.
  const showFirstTreePrompt = trees.length === 0 && !active

  useLayoutEffect(() => {
    panRef.current = pan
  }, [pan])

  useEffect(() => {
    if (!SPRITES_ENABLED) {
      return
    }

    let cancelled = false
    Promise.all([loadAtlas(), ...GROUND_TILE_SIZES.map((size) => loadGroundTile(size))]).then(
      ([loadedAtlas, ...tiles]) => {
        if (cancelled) {
          return
        }

        const bySize: Record<number, HTMLImageElement | null> = {}
        GROUND_TILE_SIZES.forEach((size, index) => {
          bySize[size] = tiles[index] ?? null
        })
        setAtlas(loadedAtlas)
        setGroundTiles(bySize)
        setSpritesReady(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const garden = gardenRef.current
    if (!garden) {
      return
    }

    // La pradera ocupa el contenedor; el canvas puede ser más chico o más
    // grande y se centra sin afectar el layout.
    const updateSize = () => {
      const rect = garden.getBoundingClientRect()
      setGardenBox((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      )
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(garden)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const next = Math.max(minZoom, pixelPerfectZoom(wheelZoomRef.current, basePixelScale))
    wheelZoomRef.current = next
    wheelAccumulatorRef.current = 0
    setZoom(next)
  }, [basePixelScale, minZoom])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !spritesReady) {
      return
    }

    if (canvas.width !== canvasWidth) {
      canvas.width = canvasWidth
    }
    if (canvas.height !== canvasHeight) {
      canvas.height = canvasHeight
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // Cada tamaño tiene su propio sheet precargado; todos miden 487×270.
    drawGarden(ctx, {
      trees,
      active,
      atlas,
      groundTile: groundTiles[gardenSize] ?? null,
      gardenSize,
      selectedSessionIds,
    })
  }, [
    trees,
    active,
    canvasWidth,
    canvasHeight,
    atlas,
    groundTiles,
    spritesReady,
    gardenSize,
    selectedSessionIds,
  ])

  useEffect(() => {
    const garden = gardenRef.current
    if (!garden) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      // Ctrl + rueda sigue siendo el zoom del navegador.
      if (event.ctrlKey || event.deltaY === 0) {
        return
      }

      event.preventDefault()
      const result = wheelZoomStep(
        wheelZoomRef.current,
        basePixelScale,
        wheelAccumulatorRef.current,
        event.deltaY,
        event.deltaMode,
      )
      wheelAccumulatorRef.current = result.accumulator
      const nextZoom = Math.max(minZoom, result.zoom)

      if (nextZoom !== wheelZoomRef.current) {
        wheelZoomRef.current = nextZoom
        setZoom(nextZoom)
      }
    }

    garden.addEventListener('wheel', handleWheel, { passive: false })
    return () => garden.removeEventListener('wheel', handleWheel)
  }, [basePixelScale, minZoom])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.defaultPrevented || event.button !== 0 || !event.isPrimary) {
        return
      }

      if (event.target instanceof Element && event.target.closest(NO_DRAG_SELECTOR)) {
        return
      }

      const garden = gardenRef.current
      if (!garden) {
        return
      }

      event.preventDefault()
      garden.setPointerCapture(event.pointerId)
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: panRef.current.x,
        originY: panRef.current.y,
        moved: false,
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const adjustZoom = (direction: 1 | -1) => {
    const next = Math.max(minZoom, stepPixelPerfectZoom(zoom, basePixelScale, direction))
    wheelZoomRef.current = next
    wheelAccumulatorRef.current = 0
    setZoom(next)
  }

  const resetView = () => {
    wheelZoomRef.current = DEFAULT_ZOOM
    wheelAccumulatorRef.current = 0
    setZoom(DEFAULT_ZOOM)
    setPanRatio({ x: 0, y: 0 })
  }

  /**
   * Convierte el punto del puntero a coordenadas de escena y busca el árbol
   * más adelante en profundidad. Si no toca un sprite, cae a la celda del
   * rombo: así también se puede elegir un árbol por su parcela.
   */
  const pickTreeAt = (clientX: number, clientY: number) => {
    if (!onSelectTree || active || !hasForest) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return
    }

    const point = {
      x: -2 + ((clientX - rect.left) / rect.width) * (SCENE_WIDTH + 4),
      y: ((clientY - rect.top) / rect.height) * SCENE_HEIGHT,
    }
    const ordered = sortByDepth(
      trees.filter(
        (tree) =>
          tree.cell.col >= 0 &&
          tree.cell.col < gardenSize &&
          tree.cell.row >= 0 &&
          tree.cell.row < gardenSize,
      ),
    ).reverse()

    for (const tree of ordered) {
      const base = treeBasePoint(tree.cell, gardenSize)
      if (atlas) {
        const frameName = treeFrameName(speciesFromKind(tree.kind), tree.stage, tree.state)
        const frame = atlas.frames[frameName]
        if (frame) {
          const bounds = atlasFrameBounds(
            atlas,
            frameName,
            base.x,
            base.baseY,
            sheetScale(frame.sheet),
          )
          if (
            bounds &&
            point.x >= bounds.left &&
            point.x <= bounds.right &&
            point.y >= bounds.top &&
            point.y <= bounds.bottom
          ) {
            onSelectTree(tree)
            return
          }
          continue
        }
      }

      if (
        point.x >= base.x - 30 &&
        point.x <= base.x + 30 &&
        point.y >= base.baseY - 112 &&
        point.y <= base.baseY + 4
      ) {
        onSelectTree(tree)
        return
      }
    }

    const cell = cellFromScenePoint(point, gardenSize)
    if (!cell) {
      onSelectTree(null)
      return
    }

    const cellTree = ordered.find(
      (tree) => tree.cell.col === cell.col && tree.cell.row === cell.row,
    )
    onSelectTree(cellTree ?? null)
  }

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
    ) {
      drag.moved = true
    }

    const next = clampPan(
      {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
      panLimits,
    )
    const nextRatio = {
      x: next.x / panLimits.x,
      y: next.y / panLimits.y,
    }

    setPanRatio((current) => {
      const currentX = Math.round(current.x * panLimits.x)
      const currentY = Math.round(current.y * panLimits.y)
      return currentX === next.x && currentY === next.y ? current : nextRatio
    })
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const garden = gardenRef.current
    if (garden?.hasPointerCapture(event.pointerId)) {
      garden.releasePointerCapture(event.pointerId)
    }

    dragRef.current = null

    if (drag.moved) {
      lastTapRef.current = null
      return
    }

    const now = Date.now()
    const last = lastTapRef.current
    if (
      last &&
      now - last.time <= 340 &&
      Math.hypot(event.clientX - last.x, event.clientY - last.y) <= 14
    ) {
      lastTapRef.current = null
      pickTreeAt(event.clientX, event.clientY)
      return
    }

    lastTapRef.current = { time: now, x: event.clientX, y: event.clientY }
  }

  const cancelDrag = () => {
    dragRef.current = null
  }

  return (
    <div
      ref={gardenRef}
      className="relative z-0 w-full select-none"
      style={{ aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}` }}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={cancelDrag}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="absolute block max-w-none"
        style={{
          width: `${canvasCssWidth}px`,
          height: `${canvasCssHeight}px`,
          left: `calc(50% + ${pan.x}px)`,
          top: `calc(50% + ${pan.y - mapCenterOffsetY}px)`,
          transform: 'translate(-50%, -50%)',
          touchAction: 'none',
        }}
        role="img"
        aria-label={label}
        draggable={false}
      />

      {showFirstTreePrompt && (
        <div className="pointer-events-none absolute inset-x-0 top-[56%] z-10 flex justify-center px-6">
          {hasForest ? (
            <p className="card card--compact type-body max-w-xs text-center font-medium">
              Este es tu bosque. Si querés otro, podés crearlo desde <strong>Bosques</strong>.
            </p>
          ) : (
            <div className="card card--compact forest-welcome pointer-events-auto">
              <span className="session-icon forest-welcome__icon">
                <PineIcon />
              </span>
              <p className="type-title">Creá tu bosque</p>
              <p className="type-caption type-muted forest-welcome__copy">
                Un objetivo, un lugar para crecer. Abrí la sección <strong>Bosques</strong> para
                crear el primero.
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="zoom-control"
        role="group"
        aria-label="Zoom de la pradera; también funciona con la rueda del mouse"
      >
        <button
          type="button"
          className="zoom-button"
          aria-label="Acercar la pradera"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => adjustZoom(1)}
        >
          <PlusIcon />
        </button>

        <button
          type="button"
          className="zoom-button"
          aria-label="Alejar la pradera"
          disabled={zoom <= minZoom}
          onClick={() => adjustZoom(-1)}
        >
          <MinusIcon />
        </button>

        <button
          type="button"
          className="zoom-button"
          aria-label="Restablecer el zoom y centrar la pradera"
          title="Volver al zoom inicial y centrar"
          onClick={resetView}
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  )
}
