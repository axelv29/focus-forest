import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  GRID_PIXEL_HEIGHT,
  ISLAND_DEPTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TOP_PADDING,
} from '@/config/grid'
import { DEFAULT_ZOOM, MAX_ZOOM } from '@/config/zoom'
import { clampPan, panLimit, type PanOffset } from '@/logic/pan'
import {
  fitPixelScale,
  minPixelPerfectZoom,
  pixelPerfectZoom,
  snapPixelScale,
  stepPixelPerfectZoom,
  wheelZoomStep,
} from '@/logic/zoom'
import { drawGarden, type ActiveTreePreview } from '@/render/drawGarden'
import { loadAtlas, loadGroundTile, SPRITES_ENABLED, type Atlas } from '@/render/sprites'
import type { Tree } from '@/state/types'
import { MinusIcon, PlusIcon, ResetIcon } from './icons'

interface GardenCanvasProps {
  trees: readonly Tree[]
  active: ActiveTreePreview | null
  label: string
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

const NO_DRAG_SELECTOR =
  'button, input, textarea, select, a, label, .zoom-control, .card, .dialog-backdrop, [role="dialog"], [role="button"], [contenteditable="true"], [data-no-pan]'

/** Diferencia entre el centro visual del diorama y el centro de la escena. */
const MAP_CENTER_OFFSET_Y = TOP_PADDING + (GRID_PIXEL_HEIGHT + ISLAND_DEPTH) / 2 - SCENE_HEIGHT / 2

export function GardenCanvas({ trees, active, label }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gardenRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const panRef = useRef<PanOffset>({ x: 0, y: 0 })
  const wheelZoomRef = useRef(DEFAULT_ZOOM)
  const wheelAccumulatorRef = useRef(0)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [groundTile, setGroundTile] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [panRatio, setPanRatio] = useState<PanOffset>({ x: 0, y: 0 })
  const [gardenSize, setGardenSize] = useState({ width: 0, height: 0 })
  const dpr = typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1)

  const hasGardenSize = gardenSize.width > 0 && gardenSize.height > 0
  const idealBaseScale = hasGardenSize
    ? Math.min((gardenSize.width * dpr) / SCENE_WIDTH, (gardenSize.height * dpr) / SCENE_HEIGHT)
    : 1
  const basePixelScale = fitPixelScale(idealBaseScale)
  // No bajamos de 1:1 salvo que el propio contenedor sea más chico que la
  // escena. Así el zoom-out nunca pierde píxeles por muestreo.
  const minZoom = minPixelPerfectZoom(basePixelScale)
  const pixelScale = snapPixelScale(basePixelScale * zoom)
  // 2 px extra: el tileset tiene su vértice en un medio píxel y, al redondear
  // la traslación, el borde derecho quedaría cortado medio píxel.
  const canvasWidth = Math.max(1, Math.round(SCENE_WIDTH * pixelScale) + 2)
  const canvasHeight = Math.max(1, Math.round(SCENE_HEIGHT * pixelScale))
  const canvasCssWidth = canvasWidth / dpr
  const canvasCssHeight = canvasHeight / dpr
  // Centra el diorama, no solo la caja del canvas; así el recorrido tiene el
  // mismo aire arriba y abajo.
  const mapCenterOffsetY = (MAP_CENTER_OFFSET_Y * pixelScale) / dpr
  // El límite crece con el zoom y con el desborde real del canvas. Guardamos la
  // posición como fracción del límite para que al cambiar de zoom se mantenga
  // proporcional y no salte al volver a acercar.
  const panLimits = panLimit(
    zoom,
    canvasCssWidth,
    canvasCssHeight,
    gardenSize.width,
    gardenSize.height,
  )
  const pan = useMemo(
    () => ({
      x: Math.round(panRatio.x * panLimits.x),
      y: Math.round(panRatio.y * panLimits.y),
    }),
    [panRatio.x, panRatio.y, panLimits.x, panLimits.y],
  )

  useLayoutEffect(() => {
    panRef.current = pan
  }, [pan])

  useEffect(() => {
    if (!SPRITES_ENABLED) {
      return
    }

    let cancelled = false
    Promise.all([loadAtlas(), loadGroundTile()]).then(([loadedAtlas, loadedTile]) => {
      if (!cancelled) {
        setAtlas(loadedAtlas)
        setGroundTile(loadedTile)
      }
    })

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
      setGardenSize((current) =>
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
    if (!canvas) {
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

    drawGarden(ctx, { trees, active, atlas, groundTile })
  }, [trees, active, canvasWidth, canvasHeight, atlas, groundTile])

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

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
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

      {trees.length === 0 && !active && (
        <div className="pointer-events-none absolute inset-x-0 top-[56%] z-10 flex justify-center px-6">
          <p className="card card--compact type-body max-w-xs text-center font-medium">
            Empezá un pomodoro para plantar tu primer árbol.
          </p>
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
