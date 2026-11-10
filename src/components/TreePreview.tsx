import { useEffect, useRef } from 'react'
import { loadAtlas, treeFrameName } from '@/render/sprites'
import type { TreeSpecies, TreeStage, TreeState } from '@/state/types'

interface TreePreviewProps {
  species: TreeSpecies
  stage: TreeStage
  state?: TreeState
}

/**
 * Miniatura del atlas para la tarjeta de sesión. Se dibuja a tamaño nativo y
 * el CSS la escala con píxeles duros, así se ve el arte real de cada etapa.
 */
export function TreePreview({ species, stage, state = 'mature' }: TreePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const request = { cancelled: false }

    void loadAtlas().then((atlas) => {
      if (request.cancelled || !atlas) {
        return
      }

      const frame = atlas.frames[treeFrameName(species, stage, state)]
      const image = frame ? atlas.images[frame.sheet] : undefined
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!frame || !image || !canvas || !ctx) {
        return
      }

      canvas.width = frame.w
      canvas.height = frame.h
      ctx.clearRect(0, 0, frame.w, frame.h)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h)
    })

    return () => {
      request.cancelled = true
    }
  }, [species, stage, state])

  return <canvas ref={canvasRef} className="tree-preview" aria-hidden="true" />
}
