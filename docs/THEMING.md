# Tema visual — Focus Forest

El objetivo de este sistema es que cambiar la identidad visual del DOM no obligue a buscar colores, tamaños o sombras sueltas por los componentes.

## Dónde vive el tema

| Archivo | Responsabilidad |
| --- | --- |
| `src/styles/theme.css` | **Fuente de verdad**: paleta, tipografías, escala de texto, bordes, sombras, movimiento y tokens semánticos de tarjetas, botones, progreso, avisos y zoom. |
| `src/index.css` | Puente con Tailwind (`@theme`), estilos base y clases de componentes que consumen los tokens. |
| `src/main.tsx` | Importa las fuentes de `@fontsource`. Si cambiás de familia, actualizá estos imports. |

La regla práctica: **los valores se cambian en `theme.css`; los componentes no llevan hex, tamaños de fuente ni sombras propias.**

## Cómo está organizado

### 1. Paleta

`theme.css` define los colores base con el prefijo `--palette-*`:

```css
--palette-ink: #203f3b;
--palette-primary: #3a684f;
--palette-background: #e9edd0;
```

`index.css` los registra en Tailwind para que existan utilidades como `bg-background`, `text-ink` o `border-bark`:

```css
@theme {
  --color-ink: var(--palette-ink);
  --color-background: var(--palette-background);
}
```

Si agregás un color nuevo:

1. Agregá el valor `--palette-*` en `theme.css`.
2. Registralo como `--color-*` en el bloque `@theme` de `index.css`.
3. Usalo desde una clase de componente o un token semántico. No lo escribas como hex en un `.tsx`.

### 2. Tarjetas

Todas las tarjetas usan `.card`:

```tsx
<section className="card">...</section>
```

Variantes de espacio:

- `.card` — padding normal.
- `.card--compact` — avisos y controles.
- `.card--roomy` — diálogos.

Los tokens `--card-*` controlan fondo, texto, borde, radio, sombra y padding. Si querés tarjetas con otra forma, cambiá esos tokens y todas las tarjetas acompañan.

`.card--session` es la tarjeta del árbol: usa el fondo verde muy claro de `--card-bg-session`.

### 3. Tipografía

Las familias viven en `--theme-font-sans` (Nunito, textos y números) y `--theme-font-button` (Quicksand, botones y controles). Los tamaños viven en `--type-*`.

Clases disponibles:

- `.app-title` — título de la app en Nunito.
- `.eyebrow` — etiqueta corta en mayúsculas (SESIÓN, ENFOQUE, ESTADÍSTICAS).
- `.type-title` — títulos de tarjeta y diálogo.
- `.type-title-lg` — título de la vista de estadísticas.
- `.type-timer` — reloj grande, con números tabulares.
- `.type-stat` — número grande de estadística.
- `.type-body` — texto normal.
- `.type-caption` — texto secundario chico.
- `.type-micro` — etiquetas y datos mínimos (pie del anillo, filas de la tarjeta).
- `.type-muted` — color de texto secundario.

No uses `text-[9px]`, `text-5xl` o `font-button` directamente en un componente nuevo si ya existe una clase para ese rol. Así un cambio de escala se hace en un solo lugar.

### 4. Botones

Base: `.btn`. Variantes: `.btn-primary`, `.btn-secondary`, `.btn-ghost-danger`, `.btn-danger`. Tamaño chico: `.btn--sm`.

Los tokens `--button-*` controlan borde, padding, radio, sombra y colores. Los estados hover/active también salen de tokens.

`.btn-ghost-danger` es la acción destructiva tranquila: se ve neutra y toma el tinte terracota recién al hover. `.btn-danger` es la confirmación sólida del diálogo.

### 5. Otros elementos

- `.timer-ring`, `.timer-ring__track`, `.timer-ring__fill`, `.timer-ring__tip`, `.timer-ring__time`, `.timer-ring__caption` — anillo del temporizador. Su degradado verde es el único degradado sancionado del tema.
- `.view-switch`, `.view-switch__button` — selector Bosque / Estadísticas. Se deshabilita durante una sesión activa.
- `.stage-track` y sus modificadores `--done`, `--current`, `--upcoming` — línea de etapas de la tarjeta de sesión.
- `.session-data` y sus filas — datos de la sesión.
- `.toast--success`, `.toast--warning`, `.toast--info` — tono de los avisos. El tono se elige en `CompletionToast.tsx` solo por nombre de clase.
- `.dialog-backdrop` — fondo del diálogo de confirmación.
- `.zoom-control`, `.zoom-button` — tres botones flotantes (acercar, alejar, restablecer); no hay slider ni porcentaje visible.

## Cambiar el tema completo

Para una variante visual, duplicá los tokens de `:root` en `theme.css` bajo un selector de tema, por ejemplo:

```css
[data-theme='otono'] {
  --palette-background: #efe2c8;
  --palette-primary: #7a4b2a;
  --palette-cream: #fff4dc;
}
```

Después alcanza con poner `data-theme="otono"` en `<html>`: los tokens de `:root` se resuelven en ese mismo elemento. Los componentes y las utilidades de Tailwind siguen apuntando a los mismos tokens, así que no hay que tocar el TSX.

La app de la v0.1 no tiene selector de temas ni modo oscuro; esto es la base para agregarlos sin desordenar los componentes.

## Qué no entra en este tema

La isla y el césped del canvas siguen siendo arte placeholder. Los árboles ya usan el atlas de sprites y no forman parte de `theme.css`; no hace falta migrar esos colores al tema.

## Checklist antes de cerrar un cambio visual

- [ ] Los valores nuevos están en `theme.css`, no en los `.tsx`.
- [ ] Las tarjetas usan `.card` y sus variantes.
- [ ] Los textos usan `.type-*` o `.eyebrow`.
- [ ] Los botones usan `.btn` y una variante.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.
- [ ] Se revisó el layout a 1440×900 y a 360 px.
- [ ] El contraste de textos sobre fondos sigue siendo legible.
