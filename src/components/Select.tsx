import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
  value: string
  label: string
  /** Texto corto para el disparador; el menú sigue mostrando `label`. */
  shortLabel?: string
  /** Deshabilitada: se muestra pero no se puede seleccionar. */
  disabled?: boolean
}

interface SelectProps {
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

interface MenuStyle {
  top: number
  left: number
  width: number
  maxHeight: number
}

/** Desplegable propio: disparador tipo pill y menú redondeado, sin la caja nativa. */
export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<MenuStyle | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selected = options.find((option) => option.value === value)

  const closeMenu = useCallback(() => setOpen(false), [])

  const openMenu = useCallback(() => {
    const firstEnabled = options.findIndex((option) => !option.disabled)
    const index = options.findIndex((option) => option.value === value && !option.disabled)
    setActiveIndex(index >= 0 ? index : Math.max(firstEnabled, 0))
    setOpen(true)
  }, [options, value])

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const width = Math.max(rect.width, 144)
    const left = Math.min(
      Math.max(8, rect.right - width),
      Math.max(8, window.innerWidth - width - 8),
    )
    const estimatedHeight = options.length * 30 + 10
    const spaceBelow = window.innerHeight - rect.bottom - 10
    const spaceAbove = rect.top - 10
    const opensUp = spaceBelow < Math.min(estimatedHeight, 180) && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      96,
      Math.min(estimatedHeight, opensUp ? spaceAbove : spaceBelow),
    )
    const top = opensUp ? rect.top - maxHeight - 6 : rect.bottom + 6

    setMenuStyle({ top, left, width, maxHeight })
  }, [options.length])

  useLayoutEffect(() => {
    if (open) {
      updateMenuPosition()
    }
  }, [open, updateMenuPosition])

  // Cierra al hacer clic afuera y sigue al disparador al scrollear.
  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      closeMenu()
    }

    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return
      }
      updateMenuPosition()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', updateMenuPosition)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [open, closeMenu, updateMenuPosition])

  useEffect(() => {
    if (!open) {
      return
    }

    const menu = menuRef.current
    const option = document.getElementById(`${listboxId}-${activeIndex}`)
    if (!menu || !option) {
      return
    }

    // Desplaza solo el menú, sin mover el panel que lo contiene.
    const menuRect = menu.getBoundingClientRect()
    const optionRect = option.getBoundingClientRect()
    if (optionRect.top < menuRect.top) {
      menu.scrollTop -= menuRect.top - optionRect.top
    } else if (optionRect.bottom > menuRect.bottom) {
      menu.scrollTop += optionRect.bottom - menuRect.bottom
    }
  }, [open, activeIndex, listboxId])

  const commit = (option: SelectOption) => {
    if (option.disabled) {
      return
    }

    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  /** Índices seleccionables (sin las opciones deshabilitadas). */
  const enabledIndices = options
    .map((option, index) => (option.disabled ? -1 : index))
    .filter((index) => index >= 0)

  const moveToEnabled = (delta: 1 | -1) => {
    if (enabledIndices.length === 0) {
      return
    }

    const position = enabledIndices.indexOf(activeIndex)
    const next =
      position === -1
        ? delta === 1
          ? 0
          : enabledIndices.length - 1
        : (position + delta + enabledIndices.length) % enabledIndices.length

    setActiveIndex(enabledIndices[next])
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) {
          openMenu()
          return
        }
        moveToEnabled(event.key === 'ArrowDown' ? 1 : -1)
        break
      }
      case 'Home':
        if (open && enabledIndices.length > 0) {
          event.preventDefault()
          setActiveIndex(enabledIndices[0])
        }
        break
      case 'End':
        if (open && enabledIndices.length > 0) {
          event.preventDefault()
          setActiveIndex(enabledIndices[enabledIndices.length - 1])
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) {
          openMenu()
          return
        }
        if (options[activeIndex] && !options[activeIndex].disabled) {
          commit(options[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          event.stopPropagation()
          closeMenu()
        }
        break
      case 'Tab':
        if (open) {
          closeMenu()
        }
        break
    }
  }

  return (
    <div className={`select${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className="select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="select__value">{selected?.shortLabel ?? selected?.label ?? value}</span>
        <svg
          className="select__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div ref={menuRef} className="select-menu" style={menuStyle}>
            <div role="listbox" id={listboxId} aria-label={ariaLabel} className="select-menu__list">
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  id={`${listboxId}-${index}`}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  disabled={option.disabled}
                  className={`select-option${
                    index === activeIndex && !option.disabled ? ' is-active' : ''
                  }${option.value === value ? ' is-selected' : ''}${
                    option.disabled ? ' is-disabled' : ''
                  }`}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setActiveIndex(index)
                    }
                  }}
                  onClick={() => commit(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
