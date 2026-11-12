import { useState, type PointerEvent as ReactPointerEvent } from 'react'

/** Distancia al borde derecho en la que el scrollbar se hace visible. */
const SCROLLBAR_EDGE_HINT = 28

/**
 * Scrollbar delicado que solo aparece cuando el puntero está cerca del borde
 * derecho del contenedor. Se combina con la clase `edge-scrollbar` del CSS.
 */
export function useEdgeScrollbar<T extends HTMLElement>() {
  const [nearEdge, setNearEdge] = useState(false)

  const onPointerMove = (event: ReactPointerEvent<T>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setNearEdge(rect.right - event.clientX <= SCROLLBAR_EDGE_HINT)
  }

  const onPointerLeave = () => setNearEdge(false)

  return { nearEdge, onPointerMove, onPointerLeave }
}
