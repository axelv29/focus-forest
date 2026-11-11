interface IconProps {
  className?: string
}

/** Pino simple: el mismo ícono para la marca, la sesión y la vista Bosque. */
export function PineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.5 7 11h2.8L5.5 17.5h13L14.2 11H17L12 3.5Z" fill="currentColor" />
      <rect x="11.1" y="17" width="1.8" height="4" rx="0.6" fill="currentColor" />
    </svg>
  )
}

/** Barras de la vista Estadísticas. */
export function BarsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="4" y="12" width="3.6" height="7" rx="1.2" />
      <rect x="10.2" y="7" width="3.6" height="12" rx="1.2" />
      <rect x="16.4" y="10" width="3.6" height="9" rx="1.2" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="7" y="5" width="3.4" height="14" rx="1.5" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="1.5" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  )
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 12h13" />
    </svg>
  )
}

/** Tuerca de ajustes. */
export function GearIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

/** Parlante con ondas: previsualizar tono. */
export function VolumeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 7a7.5 7.5 0 0 1 0 10" />
    </svg>
  )
}

/** Flecha para volver. */
export function BackIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

/** Retícula: restablece el zoom y recentra la pradera. */
export function ResetIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5.2" />
      <path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4" />
      <path d="M8 13h2M14 13h2M8 16.5h2M14 16.5h2" />
    </svg>
  )
}

/** Pinos juntos: la vista de listado de bosques. */
export function TreesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3.5 7 11h2.8L5.5 17.5h13L14.2 11H17L12 3.5Z" />
      <rect x="11.1" y="17" width="1.8" height="4" rx="0.6" />
      <path
        d="M19.6 8.2c-.8.7-2 .9-3.1.9-1.6 0-2.9-.8-3.5-1.9.55 1 .95 1.45 1.95 1.45.85 0 1.7-.28 2.45-.85Z"
        opacity="0.72"
      />
      <rect x="18.5" y="16.6" width="1.3" height="2.9" rx="0.5" opacity="0.72" />
    </svg>
  )
}

/** Lápiz: editar un bosque. */
export function PencilIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

/** Caja/archivo: archivar un bosque. */
export function ArchiveIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2" />
      <path d="M6 9v8.5A2 2 0 0 0 8 19.5h8a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </svg>
  )
}

/** Desarchivar: devolver un bosque a la vista principal. */
export function UnarchiveIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2" />
      <path d="M6 9v8.5A2 2 0 0 0 8 19.5h8a2 2 0 0 0 2-2V9" />
      <path d="M12 16v-5.5" />
      <path d="m9.5 12.5 2.5-2.5 2.5 2.5" />
    </svg>
  )
}

/** Bote de basura: eliminar un bosque. */
export function TrashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
