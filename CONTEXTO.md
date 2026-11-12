# CONTEXTO — Focus Forest

Reglas del proyecto para cualquier persona o agente que trabaje en este repositorio. Leer junto con `FICHA_v0.1.md`; el plan y la guía de estilo están en [`docs/PLAN.md`](./docs/PLAN.md), y el sistema visual en [`docs/THEMING.md`](./docs/THEMING.md).

## Qué es

App web de enfoque con pomodoro de 25 minutos y descanso de 5. Cada enfoque completado planta un árbol en un bosque isométrico propio: pino a los 25 minutos, abedul a los 45, roble desde los 60 y ceibo desde los 90. Abandonar deja el árbol marchito. Un bosque representa un objetivo (una materia, un semestre, un examen) y tiene nombre, tamaño de 4×4 a 8×8 y, opcionalmente, descripción, fecha de fin y meta de horas. Una sesión puede ser un pomodoro suelto o una serie de hasta 8 con un mismo objetivo; el historial del bosque agrupa los árboles de cada serie. Todo se guarda en el navegador.

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
  config/      datos del juego: grilla, duraciones, umbrales, zoom y límites de sesión
  state/       tipos, store, persistencia y selectores
  logic/       funciones puras: timer, growth, stats, placement, day, zoom, history
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

- Especie por duración: 25 min → pino; 45 min o más → abedul; 60 min o más → roble; 90 min o más → ceibo. Se usa el bloque más cercano por debajo (`speciesForFocusMin`).
- En Ajustes, los tiempos de pomodoro sin una especie configurada (15, 90 y 120) aparecen deshabilitados; al sumar una especie, su duración se habilita sola (`availableFocusMinutes`).
- Abedul: 5 etapas proporcionales a los 45 minutos (0, 25, 50, 75 y 100 %): brote, plantín, joven, maduro y adulto.
- Pino: 4 etapas proporcionales a los 25 minutos (0, 20, 60 y 100 %): brote, joven, maduro y adulto.
- Roble: 7 etapas proporcionales a los 60 minutos (0, 16, 33, 50, 66, 83 y 100 %): brote, plantín, joven, maduro, grande, muy grande y adulto. Los abandonados usan `roble_muerto_atlas.png` (mismos 7 frames).
- Ceibo: 7 etapas proporcionales a los 90 minutos (0, 16, 33, 50, 66, 83 y 100 %): brote, plantín, joven, maduro, grande, muy grande y adulto. Los abandonados usan `ceibo_muerto_atlas.png` (mismos 7 frames).
- Una sesión de enfoque completada termina en la última etapa de su especie (5 en abedul, 4 en pino, 7 en roble, 7 en ceibo).
- El árbol se reserva al empezar la sesión; se dibuja creciendo en su celda.
- Abandonar deja un árbol marchito, con el frame marchito de la etapa alcanzada y los minutos de enfoque reales (sin pausas) que corría antes de abandonar; esos minutos se registran en el historial, no en las estadísticas de pomodoros completados.
- La nueva celda se elige aleatoriamente entre las libres, sin espaciamiento mínimo: se pueden ocupar las 64 celdas de la grilla. Si no quedan libres, se reemplaza el marchito más viejo; si solo hay adultos, se bloquea el inicio.

### Datos

- `PersistedV4` es la única forma guardada. Cualquier cambio de forma sube `version` y agrega un caso en `migrate`.
- `Forest` es el contenedor del objetivo: `id`, `name`, `description`, `size` (4–8), `createdAt`, `endsOn` (clave local `YYYY-MM-DD` o `null`), `goalHours` (o `null`) y `archivedAt` (o `null`). Los árboles, las sesiones y la sesión activa llevan `forestId`; un descanso no tiene bosque.
- `SessionPlan` agrupa uno o varios pomodoros con el mismo objetivo: `id`, `forestId`, `title`, `description`, `tasks`, `targetPomodoros` (1–8), `completedPomodoros`, `createdAt` y `finishedAt` (o `null`). Cada `FocusRecord` de la serie copia `planId`, `pomoIndex`, `pomoTotal`, `title`, `description` y `tasks`. `activePlanId` señala la serie que se puede continuar; una serie se cierra al llegar a la meta o al abandonar cualquiera de sus pomodoros.
- Los árboles de una serie NO son adyacentes: cada pomodoro usa la colocación normal. La agrupación es lógica (`planId`) y se refleja en el historial y al seleccionar la sesión.
- Al arrancar sin datos se crea un bosque predeterminado “Mi bosque” de 8×8 y queda activo: la primera pantalla ya muestra la pradera, no el diálogo de creación. Migrar datos viejos también usa ese bosque si no había ninguno y les asigna ese `forestId`. Si se borran todos los bosques, al recargar vuelve a aparecer “Mi bosque”.
- La fecha de fin se guarda como día local, no como epoch: evita corrimientos por zona horaria. El contador se deriva al renderizar con `Date.UTC` y no se persiste.
- El nombre y el contador se pueden ocultar desde Ajustes (`display.showForestName`, `display.showCountdown`); por defecto se muestran ambos.
- Los descansos no se guardan como historial; solo existe el descanso activo.
- El historial por bosque se deriva de `sessions`, `plans` y `trees`; no se guarda una copia. Agrupa por `planId ?? id`, muestra completadas, abandonadas, mixtas y la en curso, e incluye filtros Todas, Hoy, Esta semana, Series y Marchitas. Las sesiones de otro bosque no aparecen. Los abandonos registran los minutos reales enfocados antes de marchitarse; las completadas suman su duración planeada.
- Las estadísticas se derivan; no guardar contadores duplicados.
- Al rehidratar, reconciliar: enfoque vencido → completar; descanso vencido → cerrar; pausado → no completar.
- Datos dañados: copiar a `focus-forest.broken` y reiniciar. Versión más nueva: avisar y bloquear escrituras sin tocar el original. localStorage bloqueado o lleno: avisar y seguir en memoria.

### Isometría

- Celda 60×30; grilla máxima 8×8; escena lógica 480×400 (240 de grilla + 128 de margen superior + 32 de tierra). La escala base es la misma para todos los tamaños de bosque: un 8×8 llena la escena y un 4×4 se ve proporcionalmente más chico; la isla se centra verticalmente según su tamaño. La escala base se elige entera según el contenedor (0.5× solo si es más chico que la escena; luego 1×, 2×…). El zoom usa solo escalas pixel-perfect: múltiplos enteros de la escala de origen (0.5× solo como ajuste mínimo), sin medios pasos ni niveles intermedios fraccionarios. El zoom no baja de 1:1 salvo cuando la base ya es menor.
- `x = origenX + (col - row) * 30`
- `y = origenY + (col + row) * 15`
- Orden de dibujo: `col + row` ascendente, desempate por `col`.
- Sprites anclados en la base del tronco; cada especie usa su atlas y sus frames recortados, todos a tamaño nativo. El pino mide 122×92; el abedul vivo y el marchito miden 187×130 cada uno; el roble mide 314×142 y su marchito 278×144; el ceibo mide 389×148 (vivo) y su marchito 350×143, con el adulto en 107×144 y el brote en 7×11. Todos los frames incluyen la sombra pixelada semitransparente, así que el marco llega un poco más abajo que el arte y el anclaje marca la base del tronco; en horizontal apunta al centro de la sombra para que el árbol quede centrado en su celda.
- `imageSmoothingEnabled = false` y `image-rendering: pixelated`.
- Redibujar al cambiar etapa, árboles o tamaño/zoom; no en cada tick del timer.

### Interfaz

- Español para la UI; inglés para identificadores, archivos y tipos.
- Tema centralizado: `src/styles/theme.css` es la fuente de verdad; `src/index.css` lo registra en Tailwind y define las clases de componentes. No usar hex, tamaños de fuente ni sombras sueltas en los `.tsx`.
- Tarjetas con `.card` (y `--compact`/`--roomy`); botones con `.btn` y variantes; textos con `.type-*` o `.eyebrow`. Ver `docs/THEMING.md`.
- La creación de bosque es un diálogo aparte, no la pantalla de cambio de bosque. Se abre desde la vista Bosques (o desde Iniciar cuando todavía no hay bosque) y usa el mismo sistema de tarjetas, botones, selects y campos que Ajustes. Incluye una vista previa con el atlas real y árboles de ejemplo de distintas especies y etapas. El selector de fecha es propio, no el calendario nativo del navegador.
- La cabecera muestra el nombre del bosque activo y, si tiene fecha, un chip con “Faltan N días” / “Último día” / “Terminó…”. No se muestra nada si ambos ajustes están ocultos.
- El switch de vistas tiene tres opciones: **Bosque**, **Estadísticas** y **Bosques**. La vista Bosques lista los bosques con su tamaño y estado; elegir uno lo vuelve activo y lleva a la vista Bosque. Desde ahí también se crea un nuevo bosque y se abre el historial de cada uno.
- El **Historial** no es una vista más: es una ventana flotante del bosque activo que se abre con el botón discreto de la tarjeta del timer y se apila a la izquierda, debajo de la tarjeta de sesión. Tiene filtros (Todas, Hoy, Esta semana, Series, Marchitas) y una lista con scroll propio. La card se corta antes del borde inferior de la pantalla (la columna no scrollea): lo que queda abajo se ve desplazando solo la lista, con una barra fina y delicada que aparece al acercar el puntero al borde derecho. Cada fila agrupa un pomodoro o una serie, con fecha y hora, minutos de enfoque, estado y cantidad de árboles. Al elegir una sesión con el timer libre, la pradera resalta todos sus árboles y atenúa el resto, y la tarjeta de detalle aparece en la misma columna izquierda. Con un pomodoro en curso también se puede elegir una sesión desde el historial: el detalle se despliega debajo de la tarjeta del timer y la pradera atenúa igual el resto, incluido el árbol que está creciendo. La sesión en curso también aparece en el historial con su estado "En curso" y los minutos enfocados hasta ahora.
- **Iniciar** abre el diálogo de sesión cuando hay bosque: nombre, descripción, objetivos y uno o varios pomodoros. Si la pradera todavía no tiene bosque, primero abre el diálogo de creación y después el de sesión. Una serie pendiente se puede continuar desde el timer; empezar una nueva cierra la anterior.
- Un árbol o una celda se pueden seleccionar con doble clic (también con el historial abierto): se abre la tarjeta de la sesión a la que pertenecen. Si los árboles se superponen, el historial sigue siendo la vía confiable.
- En desktop las tarjetas se anclan a 16 px de los bordes de la ventana con ancho fluido: el timer es la tarjeta principal y siempre es más ancha que la de sesión.
- Dos fuentes: Nunito (textos, títulos y timer) y Quicksand 600 (botones y controles). Se sirven desde `@fontsource`.
- Forma suave: esquinas de 12 a 16 px, bordes finos translúcidos, sombras muy tenues y sin degradados, salvo el anillo del temporizador. Nada de estética pixel en el DOM.
- La tarjeta de sesión solo aparece mientras corre un enfoque (también en pausa): nombre de la sesión (o el derivado si no tiene), día y hora de inicio, estado del árbol y bosque. En series muestra “Pomodoro N de M”. La línea de etapas resume el crecimiento y el ícono es una miniatura del atlas de la etapa actual.
- La selección de una sesión en la pradera no cambia los datos ni el timer: los árboles de esa sesión se dibujan al final y a opacidad completa, sin marcas en la grilla, y el resto baja a 0.32. Funciona igual con un pomodoro en curso: el árbol en crecimiento también se atenúa porque no pertenece a la sesión elegida. El doble clic se detecta manualmente (dos toques en menos de 340 ms y 14 px) porque el canvas cancela el evento nativo.
- Respetar `prefers-reduced-motion`.
- Durante una sesión: el selector de vistas se deshabilita y no se puede cambiar de ventana; timer, pausa y abandonar siguen a mano.
- Zoom de la pradera: control de vista de 0.5× a 2×, solo en memoria; se usa con tres botones flotantes (acercar, alejar y restablecer) o con la rueda del mouse; no toca timer, store ni persistencia. En desktop los niveles posibles son 50, 100, 150 y 200 %: todos son escalas enteras de origen y por lo tanto pixel-perfect estrictos. No hay niveles intermedios fraccionarios. La rueda avanza un nivel entero por giro (50→100→150→200) y acumula los deltas chicos de un trackpad. Si la escala base ya entra a 1:1, el mínimo es 1×. No hay slider ni porcentaje visible.

- Arrastre de la pradera: con un clic izquierdo normal se puede mover el mapa desde cualquier zona libre de la página; no cambia el cursor. El diorama se centra verticalmente y el desplazamiento se mide simétricamente desde ese centro. El recorrido base escala con el zoom y se le suma el desborde del canvas más 80 px de margen: en desktop, unos 80 px a los lados al 50 %, 150 px al 100 %, 289 px al 150 % y 529 px al 200 % (vertical: 85, 170, 255 y 454 px). La posición se guarda como fracción del límite para que al cambiar de zoom se mantenga proporcional y no salte. El botón de retícula vuelve a la vista inicial y recentra la pradera. El arrastre no cambia el zoom, el timer ni el store.
- El suelo usa el sheet del tamaño de bosque elegido (`tileset4x4.png` … `tileset8x8.png`; todos miden 487×270 con el rombo y la isla anclados abajo-centro, así que se dibujan enteros y la escena sigue siendo 480×400 en cualquier tamaño) y los árboles usan sus atlas; los placeholders de `drawGarden.ts` quedan solo como fallback.
- Mobile no es parte de la v0.1, pero la app no debe romperse a 360 px.

### Sprites y atlas

- Los atlas definitivos no se retocan a mano ni se reescalan con interpolación suave: se generan desde la imagen de IA con `pixelperfect/pixelperfect_atlas.py`, que vive fuera del repo, en la raíz del workspace. La guía completa, parámetros y verificación están en `../pixelperfect/README.md`; leerla antes de generar o reemplazar un atlas.
- Requisitos: Python 3 con `pillow`, `numpy` y `scipy`.
- Entrada: una sola fila de sprites ordenados de brote a adulto, sin solaparse en x y separados por al menos una columna vacía. Fondo transparente o liso; si queda fondo atrapado entre ramas, `--bg-all`.
- Comando base desde la raíz del workspace:
  `python pixelperfect/pixelperfect_atlas.py <entrada> --ref focus-forest/public/sprites/pino_atlas.png --name <especie> --out pixelperfect/salida_<especie>`
  Sin referencia: `--heights 11,43,54,85`.
- `--ref` mide el arte con alfa > 128, no los `h` del JSON. Con el atlas del pino da `[11,43,54,85]`; pasar `13,46,58,89` agranda los árboles. Las etapas extra usan el factor de la última etapa fijada (`--scale` para forzarlo).
- No cambiar el filtro BOX, el alfa duro 0/255, la semilla 1 del k-means ni el redondeo: son la parte determinista. Nunca LANCZOS ni BICUBIC; las previews y la página escalan solo con NEAREST/`image-rendering: pixelated` y factores enteros.
- El script no escribe JSON. Después de generar `atlas.png` hay que crear el `.json` con `x/y/w/h` y `anchor` (fórmulas y snippet en la guía). Sin JSON válido, `loadAtlas()` devuelve `null` y el render usa placeholders.
- Nombres: vivos `^pino_([1-5])_` / `^abedul_([1-5])_` / `^roble_([1-7])_` / `^ceibo_([1-7])_`, marchitos `^pino_muerto_([1-5])_` / `^abedul_muerto_([1-5])_` / `^roble_muerto_([1-7])_` / `^ceibo_muerto_([1-7])_`; cada atlas vivo o marchito se carga por separado y el loader exige al menos los 4 frames del pino. La especie se guarda en `Tree.kind`; las sesiones sin especie se leen como pino.
- Antes de dar por bueno un atlas: revisar `preview_x6.png`, comprobar alfa 0/255, base alineada y paleta común, y verlo en la app a tamaño nativo y en los zoom enteros.

### Código

- TypeScript strict; evitar `any`.
- Componentes chicos; lógica fuera de los componentes.
- Sin `console.log` de depuración.
- No agregar dependencias sin consultarlo.
- No implementar funciones fuera del alcance acordado (`FICHA_v0.1.md` y `FICHA_v2.md`).

## Definición de terminado

- Criterios de `FICHA_v0.1.md` cumplidos.
- Tests de la lógica pura.
- `lint`, `test` y `build` verdes.
- Sin errores de consola.
- Si cambió un atlas: `.json` actualizado, 8 frames cargando (sin placeholders) y revisado en la app a tamaño nativo y en los zoom enteros.
- Documentación actualizada si cambió una decisión.
