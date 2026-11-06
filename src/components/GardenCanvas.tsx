import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SCENE_HEIGHT, SCENE_WIDTH } from '@/config/grid'
import { DEFAULT_ZOOM, MAX_ZOOM, ZOOM_SLIDER_STEP } from '@/config/zoom'
import {
  fitPixelScale,
  formatZoom,
  minPixelPerfectZoom,
  pixelPerfectZoom,
  snapPixelScale,
  stepPixelPerfectZoom,
  zoomFromWheel,
} from '@/logic/zoom'
import { drawGarden, type ActiveTreePreview } from '@/render/drawGarden'
import { loadAtlas, loadGroundTile, SPRITES_ENABLED, type Atlas } from '@/render/sprites'
import type { Tree } from '@/state/types'

interface GardenCanvasProps {
  trees: readonly Tree[]
  active: ActiveTreePreview | null
  label: string
}

export function GardenCanvas({ trees, active, label }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gardenRef = useRef<HTMLDivElement>(null)
  const wheelZoomRef = useRef(DEFAULT_ZOOM)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [groundTile, setGroundTile] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
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

  const snapZoom = useCallback(
    (value: number) => Math.max(minZoom, pixelPerfectZoom(value, basePixelScale)),
    [basePixelScale, minZoom],
  )

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
      const raw = Math.max(
        minZoom,
        zoomFromWheel(wheelZoomRef.current, event.deltaY, event.deltaMode),
      )
      wheelZoomRef.current = raw
      setZoom(snapZoom(raw))
    }

    garden.addEventListener('wheel', handleWheel, { passive: false })
    return () => garden.removeEventListener('wheel', handleWheel)
  }, [minZoom, snapZoom])

  const adjustZoom = (direction: 1 | -1) => {
    const next = Math.max(minZoom, stepPixelPerfectZoom(zoom, basePixelScale, direction))
    wheelZoomRef.current = next
    setZoom(next)
  }

  const changeZoom = (value: number) => {
    wheelZoomRef.current = value
    setZoom(snapZoom(value))
  }

  const resetZoom = () => {
    wheelZoomRef.current = DEFAULT_ZOOM
    setZoom(DEFAULT_ZOOM)
  }

  return (
    <div
      ref={gardenRef}
      className="relative z-0 w-full"
      style={{ aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}` }}
      title="Usá la rueda del mouse para hacer zoom"
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="pointer-events-none absolute left-1/2 top-1/2 block max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${canvasWidth / dpr}px`,
          height: `${canvasHeight / dpr}px`,
        }}
        role="img"
        aria-label={label}
      />

      {trees.length === 0 && !active && (
        <div className="pointer-events-none absolute inset-x-0 top-[56%] z-10 flex justify-center px-6">
          <p className="card card--compact type-body max-w-xs text-center font-semibold">
            Empezá un pomodoro para plantar tu primer árbol.
          </p>
        </div>
      )}

      <div
        className="zoom-control absolute left-3 top-3 z-20 sm:left-12"
        role="group"
        aria-label="Zoom de la pradera; también funciona con la rueda del mouse"
      >
        <button
          type="button"
          className="zoom-button"
          aria-label="Alejar la pradera"
          disabled={zoom <= minZoom}
          onClick={() => adjustZoom(-1)}
        >
          −
        </button>

        <input
          id="garden-zoom"
          className="zoom-slider"
          type="range"
          min={minZoom}
          max={MAX_ZOOM}
          step={ZOOM_SLIDER_STEP}
          value={zoom}
          onChange={(event) => changeZoom(Number(event.target.value))}
          aria-label="Zoom de la pradera"
          title="Arrastrá o usá la rueda del mouse"
        />

        <output className="zoom-value" htmlFor="garden-zoom" aria-live="polite">
          {formatZoom(zoom)}
        </output>

        <button
          type="button"
          className="zoom-button"
          aria-label="Acercar la pradera"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => adjustZoom(1)}
        >
          +
        </button>

        <button
          type="button"
          className="zoom-button"
          aria-label="Restablecer el zoom a 100%"
          title="Volver a 100%"
          onClick={resetZoom}
        >
          1×
        </button>
      </div>
    </div>
  )
}
