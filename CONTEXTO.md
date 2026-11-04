# CONTEXTO — Focus Forest

Reglas del proyecto para cualquier persona o agente que trabaje en este repositorio. Leer junto con `FICHA_v0.1.md`; el plan y la guía de estilo están en [`docs/PLAN.md`](./docs/PLAN.md), y el sistema visual en [`docs/THEMING.md`](./docs/THEMING.md).

## Qué es

App web de enfoque con pomodoro de 25 minutos y descanso de 5. Cada enfoque completado planta un pino en una pradera isométrica de 8×8. Abandonar deja el árbol marchito. Todo se guarda en el navegador.

## Stack

- Vite 8 + React 19 + TypeScript 7 (strict).
- Tailwind CSS v4, CSS-first, con `@tailwindcss/vite`.
- Zustand + `persist` para estado y localStorage.
- Canvas 2D para la pradera. Sin librería de juegos.
- Vitest (entorno `node`) para la lógica pura.
- oxlint + Prettier.
- npm y Node LTS. En Windows, usar `npm.cmd` si PowerShell bloquea `npm.ps1`.
- Deploy estático en Vercel.

## Comandos

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Antes de cada commit: `lint`, `test` y `build` en verde.

## Estructura

```
docs/          plan de producto, guía de estilo y sistema de tema
src/
  config/      datos del juego: grilla, duraciones, umbrales, zoom
  state/       tipos, store, persistencia y selectores
  logic/       funciones puras: timer, growth, stats, placement, day, zoom
  render/      isometría, atlas y dibujo del canvas
  styles/      tokens del tema visual (colores, fuentes, forma)
  hooks/       enlaces entre React y la lógica
  components/  interfaz
  tests/       pruebas de la lógica
```

Dirección de dependencias: `config` no importa nada; `logic` importa `config` y tipos de `state`; `state` importa `logic` y `config`; `render` y `components` importan `config`, `logic` y `state`. Los imports de tipos no generan ciclos en tiempo de ejecución.

## Convenciones

### Tiempo

- Guardar epoch ms. Nunca guardar `mm:ss` ni restar un contador segundo a segundo.
- El restante es `endsAt - now`; si está pausado, `endsAt - pausedAt`.
- Pausar corre `endsAt` por el tiempo pausado; el tiempo pausado no cuenta como enfoque.
- "Hoy" se calcula con día local (`getFullYear`, `getMonth`, `getDate`), nunca con `toISOString()`.

### Crecimiento

- 4 etapas: 0 brote, 5 joven, 15 maduro, 25 adulto.
- Una sesión de enfoque completada termina en etapa 4.
- El árbol se reserva al empezar la sesión; se dibuja creciendo en su celda.
- Abandonar deja un árbol marchito, con 0 minutos acreditados y el frame marchito de la etapa alcanzada.
- La nueva celda se elige aleatoriamente entre libres con espaciamiento mínimo; si no quedan candidatas, se reemplaza el marchito más viejo.

### Datos

- `PersistedV1` es la única forma guardada. Cualquier cambio de forma sube `version` y agrega un caso en `migrate`.
- Los descansos no se guardan como historial; solo existe el descanso activo.
- Las estadísticas se derivan; no guardar contadores duplicados.
- Al rehidratar, reconciliar: enfoque vencido → completar; descanso vencido → cerrar; pausado → no completar.

### Isometría

- Celda 64×32; grilla 8×8; escena lógica 512×416 (256 de grilla + 128 de margen superior + 32 de tierra); escala 2× → pradera nominal 1024×832. El canvas se dibuja al doble de tamaño para que el zoom pueda desbordar el recuadro sin cortar la isla.
- `x = origenX + (col - row) * 32`
- `y = origenY + (col + row) * 16`
- Orden de dibujo: `col + row` ascendente, desempate por `col`.
- Sprites anclados abajo al centro; los atlas de 122×89 contienen 4 frames recortados por estado y se dibujan a tamaño nativo.
- `imageSmoothingEnabled = false` y `image-rendering: pixelated`.
- Redibujar al cambiar etapa, árboles o zoom; no en cada tick del timer.

### Interfaz

- Español para la UI; inglés para identificadores, archivos y tipos.
- Tema centralizado: `src/styles/theme.css` es la fuente de verdad; `src/index.css` lo registra en Tailwind y define las clases de componentes. No usar hex, tamaños de fuente ni sombras sueltas en los `.tsx`.
- Tarjetas con `.card` (y `--compact`/`--roomy`); botones con `.btn` y variantes; textos con `.type-*` o `.eyebrow`. Ver `docs/THEMING.md`.
- Dos fuentes: Nunito (textos y timer) y Press Start 2P (título y etiquetas cortas).
- Bordes duros, sombras sin desenfoque, sin degradados, sin esquinas muy redondeadas.
- Respetar `prefers-reduced-motion`.
- Durante una sesión: timer, pausa y abandonar; ocultar paneles y pestañas.
- Zoom de la pradera: control de vista de 0.5× a 2×, solo en memoria; se usa con el slider, los botones o la rueda del mouse; no toca timer, store ni persistencia.
- La isla y el césped del canvas siguen siendo placeholder; la paleta de esa parte vive en `drawGarden.ts`. Los árboles ya usan el atlas y no forman parte del tema visual.
- Mobile no es parte de la v0.1, pero la app no debe romperse a 360 px.

### Código

- TypeScript strict; evitar `any`.
- Componentes chicos; lógica fuera de los componentes.
- Sin `console.log` de depuración.
- No agregar dependencias sin consultarlo.
- No implementar funciones fuera de `FICHA_v0.1.md`.

## Definición de terminado

- Criterios de `FICHA_v0.1.md` cumplidos.
- Tests de la lógica pura.
- `lint`, `test` y `build` verdes.
- Sin errores de consola.
- Documentación actualizada si cambió una decisión.
