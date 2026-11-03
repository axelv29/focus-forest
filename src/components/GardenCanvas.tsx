import { useEffect, useRef, useState } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/config/grid'
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, ZOOM_BUTTON_STEP, ZOOM_SLIDER_STEP } from '@/config/zoom'
import { clampZoom, formatZoom, stepZoom, zoomFromWheel } from '@/logic/zoom'
import { drawGarden, type ActiveTreePreview } from '@/render/drawGarden'
import { loadAtlas, SPRITES_ENABLED, type Atlas } from '@/render/sprites'
import type { Tree } from '@/state/types'

interface GardenCanvasProps {
  trees: readonly Tree[]
  active: ActiveTreePreview | null
  label: string
}

export function GardenCanvas({ trees, active, label }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gardenRef = useRef<HTMLDivElement>(null)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const width = CANVAS_WIDTH * dpr
  const height = CANVAS_HEIGHT * dpr

  useEffect(() => {
    if (!SPRITES_ENABLED) {
      return
    }

    let cancelled = false
    loadAtlas().then((loaded) => {
      if (!cancelled) {
        setAtlas(loaded)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    if (canvas.width !== width) {
      canvas.width = width
    }
    if (canvas.height !== height) {
      canvas.height = height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    drawGarden(ctx, { trees, active, atlas, zoom })
  }, [trees, active, width, height, atlas, zoom])

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
      setZoom((value) => zoomFromWheel(value, event.deltaY, event.deltaMode))
    }

    garden.addEventListener('wheel', handleWheel, { passive: false })
    return () => garden.removeEventListener('wheel', handleWheel)
  }, [])

  const adjustZoom = (delta: number) => {
    setZoom((value) => stepZoom(value, delta))
  }

  return (
    <div ref={gardenRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block h-auto w-full"
        style={{ maxWidth: CANVAS_WIDTH }}
        role="img"
        aria-label={label}
        title="Usá la rueda del mouse para hacer zoom"
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
          onClick={() => adjustZoom(-ZOOM_BUTTON_STEP)}
        >
          −
        </button>

        <input
          id="garden-zoom"
          className="zoom-slider"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_SLIDER_STEP}
          value={zoom}
          onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
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
          onClick={() => adjustZoom(ZOOM_BUTTON_STEP)}
        >
          +
        </button>

        <button
          type="button"
          className="zoom-button"
          aria-label="Restablecer el zoom a 100%"
          title="Volver a 100%"
          onClick={() => setZoom(DEFAULT_ZOOM)}
        >
          1×
        </button>
      </div>
    </div>
  )
}
