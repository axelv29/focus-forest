# Focus Forest: plan de desarrollo y guía de estilo

Plan acordado antes de escribir la lógica. Lo marcado como **✅ Cerrado** ya se decidió; lo marcado como **⏳ Abierto** se resuelve antes de publicar. El nombre original del borrador era "Pomodoro Garden".

## 1. Resumen y decisiones cerradas

- **Producto:** Focus Forest, una app web de enfoque con pomodoro de 25 minutos y descanso de 5. Cada sesión de enfoque completada planta un árbol en una pradera isométrica.
- **Stack ✅:** Vite + React + TypeScript + Tailwind CSS v4, dibujo con Canvas 2D, Zustand para el estado y Vitest para la lógica. Publicación en Vercel. Next.js se descarta (ver sección 3).
- **Alcance de la v0.1 ✅:** enfoque de 25 minutos y descanso de 5, un árbol por sesión, 4 etapas de crecimiento, pradera de 8×8, estadísticas de hoy y totales, guardado local y contador de pomodoros sin meta.
- **Tamaño de celda ✅:** 60×30 px, con árbol adulto de 44 ancho × 89 alto (atlas de 122×92 con frames recortados). Se descartan las celdas de 78×51 de las hojas de referencia.
- **Arte ✅:** propio o encargado. Una sola especie (pino) con 4 etapas vivas y 4 versiones marchitas; los assets están en `public/sprites/`.
- **Nombre ✅:** Focus Forest. Revisar antes de publicar por la proximidad con la app Forest.
- **Plataforma ✅:** navegador de escritorio primero. Mobile queda para una versión posterior.

### Registro de decisiones

| Tema | Decisión |
| --- | --- |
| Modelo de crecimiento | Un árbol por sesión; no se acumulan minutos entre sesiones |
| Enfoque | 25 minutos fijos |
| Descanso | 5 minutos, ofrecido con botón; nunca arranca solo |
| Etapas | 0 brote, 5 joven, 15 maduro, 25 adulto |
| Al completar | El árbol adulto queda en la pradera y la sesión se registra |
| Al abandonar | El árbol queda marchito con la variante de su etapa y no acredita minutos |
| Recarga | Reanuda; si el enfoque ya venció, completa; si el descanso venció, cierra |
| Celdas | 60×30, grilla 8×8, escena lógica 480×400; escala base entera y zoom solo en escalas enteras |
| Árbol adulto | 44 ancho × 89 alto; frames recortados por estado y dibujo a tamaño nativo |
| Contador | "Pomodoros hoy: N", sin meta diaria |
| Estadísticas | Hoy y totales; sin gráficos, rachas ni calendario |
| Color | Paleta de la sección 9, sin colores fuera de ella |
| Dependencias | Nada de router, gráficos, motor de juego, Supabase ni PWA en la v0.1 |

## 2. Cómo se va a trabajar

- **Lo que hace el agente:** diseña, escribe y edita archivos, corre `lint`, pruebas y `build`, y explica cada cambio.
- **Lo que hace la persona:** prueba en el navegador, cuida el arte y publica en Vercel/GitHub.
- **Forma de trabajo:** una cosa por vez, probar antes de seguir, commits chicos y frecuentes. Antes de cada commit: `npm run lint`, `npm test` y `npm run build`.
- **Documentos de referencia:** este plan, `FICHA_v0.1.md` (alcance y criterios de aceptación) y `CONTEXTO.md` (reglas para el agente). El plan vive en `docs/PLAN.md`; la ficha y el contexto, en la raíz del repositorio. El sistema visual está en `docs/THEMING.md`.

## 3. ¿Por qué Vite y no Next.js?

**Tailwind sigue siendo buena elección. Next.js no es lo más adecuado para esta app.**

Para esta app lo importante es un canvas que vive en el navegador. Next.js suma un servidor y reglas de componentes de cliente y de servidor que no hacen falta, y provocan errores típicos: el canvas y el guardado local no existen cuando la página se prepara en el servidor. Next.js sirve cuando hay muchas páginas, posicionamiento en buscadores o lógica de servidor, y nada de eso es el centro de este proyecto.

Las opciones, comparadas:

- **Sin framework (HTML y JavaScript puros):** lo más liviano, pero con sesiones, árboles y estadísticas el código se desordena rápido.
- **Vite + React + TypeScript:** equilibrio entre liviano y ordenado. Arranca rápido, genera un paquete chico y se publica como sitio estático, gratis y sin servidor propio.
- **Next.js:** funciona, pero con más piezas de las necesarias. Si algún día se quiere una página de presentación con buen posicionamiento, se puede sumar aparte.

**Tailwind CSS v4** se usa en modo CSS-first: la paleta y los tokens viven en `src/styles/theme.css`, `src/index.css` los registra en Tailwind y define las clases de componentes, y el juego se dibuja en el canvas. Tailwind solo se ocupa de los paneles, botones y textos alrededor.

## 4. Para qué sirve cada herramienta

| Herramienta | Para qué sirve | Cuándo entra |
| --- | --- | --- |
| Node.js y npm | Ejecutan las herramientas de desarrollo e instalan librerías. | Paso 1 |
| Git y GitHub | Guardan el historial y permiten volver atrás. | Paso 1 |
| Vite | Arma el proyecto, lo muestra en vivo y genera la versión optimizada. | Paso 1 |
| React | Organiza la interfaz en piezas (timer, tarjeta, estadísticas). | Paso 1 |
| TypeScript | JavaScript con tipos: detecta errores antes de ejecutar. | Paso 1 |
| Tailwind CSS | Estilos con clases cortas y la paleta como variables. | Paso 1 |
| Canvas 2D | Dibuja la pradera isométrica, sin librería de juegos. | Fase 3 |
| Zustand | Guarda el estado y lo conserva en el navegador. | Fase 4 |
| Vitest | Pruebas automáticas de timer, crecimiento, estadísticas y colocación. | Fase 2 |
| oxlint + Prettier | Revisan el código y lo mantienen con un formato uniforme. | Fase 1 |
| @fontsource | Sirve Nunito y Quicksand desde el propio sitio, sin CDN. | Fase 1 |
| Vercel | Publica la web gratis y la actualiza con cada cambio subido. | Fase 1 |
| Supabase | Cuentas, base de datos y tiempo real para bosques compartidos. | v0.3 |
| Plugin PWA de Vite | Permite instalar la web en el celular y usarla con mala conexión. | v0.3 |

## 5. Cómo mantenerla liviana y fluida

- **Un solo canvas y redibujo bajo demanda:** se vuelve a dibujar cuando cambia una etapa o se planta un árbol, no 60 veces por segundo. El crecimiento va por umbrales de minutos, así que no necesita animación continua.
- **Atlas de sprites:** los assets viven en `public/sprites/`: cada estado usa su propio atlas de pino y sus frames recortados. Se cargan una sola vez; si falta uno, se usan placeholders dibujados por código.
- **Etapas con el mismo anclaje:** las 4 versiones vivas y sus 4 versiones marchitas se dibujan a tamaño nativo desde sus frames recortados y se anclan en la base del tronco. La sombra pixelada va incluida en cada frame y puede sobresalir por debajo del ancla. Los atlas miden `122×92`.
- **Lienzo pixel-perfect:** la escena lógica mide 480×400: 240 de grilla, 128 de margen superior para que el árbol de la fila de atrás no se corte y 32 de tierra visible. La escala base se elige entera (1×, 2×, 3×…; 0.5× solo si el contenedor es más chico que la escena) y se muestra a tamaño físico. El zoom se limita a múltiplos enteros de la escala de origen (0.5× solo como ajuste mínimo): no hay medios pasos ni niveles intermedios, así que no se mezclan píxeles de 1/2 px. El zoom-out nunca baja de 1:1 si la escala base ya entra.
- **Imágenes optimizadas:** PNG comprimidos y solo los sprites que se usan.
- **Dos fuentes como máximo,** servidas localmente, con alternativa del sistema mientras cargan.
- **Carga a demanda:** las estadísticas con gráficos y Supabase entran recién cuando se usan (v0.2/v0.3).
- **Gráficos propios simples** (barras en CSS o SVG) en vez de una librería pesada.
- **Meta inicial a medir:** menos de unos 200 KB de JavaScript comprimido y menos de 1 MB de imágenes en la primera carga.

## 6. Funciones principales

### v0.1

- **Sesión de enfoque:** 25 minutos fijos. Empezar, pausar, reanudar y abandonar. La cuenta se calcula con hora de inicio y fin, no restando segundos.
- **Descanso:** 5 minutos fijos. Se ofrece al completar el enfoque con un botón; no arranca solo. Se puede pausar o saltar. No planta árbol ni suma estadísticas.
- **Crecimiento:** 4 etapas dentro de los 25 minutos: brote (0), joven (5), maduro (15) y adulto (25). Al abandonar, el árbol queda marchito con la variante de la etapa alcanzada.
- **Pradera:** grilla isométrica de 4×4 a 8×8, centrada, con isla flotante y árboles ordenados de atrás hacia adelante. La escala base es común a todos los tamaños; los bosques chicos se ven proporcionalmente más chicos y se pueden acercar con el zoom.
- **Estadísticas:** pomodoros y minutos de hoy; pomodoros y minutos totales; árboles adultos y marchitos. Sin gráficos.
- **Guardado:** local en el navegador, con versión de esquema y migración preparada.
- **Sesiones e historial:** una sesión puede ser un pomodoro o una serie de hasta 8 con nombre, descripción y objetivos. El historial del bosque agrupa los pomodoros de cada serie, incluye árboles marchitos y filtros por hoy, semana, series y marchitas.
- **Interfaz:** vistas Bosque, Estadísticas y Bosques, con el selector dentro de la tarjeta del timer. El historial es una ventana flotante que se abre desde un botón discreto del timer y se apila bajo la tarjeta de sesión. La tarjeta de sesión queda visible durante el enfoque (también en pausa) y se oculta en descanso. El selector se deshabilita mientras hay una sesión activa; timer, pausa y abandonar siguen a mano. Iniciar abre el diálogo de sesión; la pradera permite seleccionar una sesión con doble clic para resaltar sus árboles.
- **Zoom de la pradera:** control de vista de 0.5× a 2×, centrado y sin persistencia, con tres botones flotantes (acercar, alejar, restablecer) y rueda del mouse. No hay slider ni porcentaje visible. En desktop los niveles posibles son 50, 100, 150 y 200 %: todos son pixel-perfect estrictos porque usan escalas enteras de origen. No hay intermedios fraccionarios. La rueda avanza un nivel entero por giro (50→100→150→200) y acumula los deltas chicos de un trackpad. Si la escala base ya entra a 1:1, el mínimo es 1× para no perder píxeles; en pantallas muy chicas la escala base puede ser 0.5×. No cambia el timer, los árboles ni las estadísticas.

- **Arrastre de la pradera:** con un clic izquierdo normal se puede mover el mapa desde cualquier zona libre de la página, sin cambiar el cursor. El diorama se centra verticalmente y los límites se miden simétricamente desde ese centro. El recorrido base escala con el zoom y suma el desborde del canvas más 80 px de margen: en desktop, unos 80 px a los lados al 50 %, 150 px al 100 %, 289 px al 150 % y 529 px al 200 % (vertical: 85, 170, 255 y 454 px). La posición se guarda como fracción del límite para conservarse proporcional al zoomear. El botón de retícula restablece el zoom y recentra. El arrastre no modifica el timer, los árboles ni el store.

### Bosques: implementado en esta etapa

- **Entidad `Forest`:** nombre, descripción opcional, tamaño 4×4–8×8, fecha de fin opcional, meta de horas opcional y archivado futuro. Árboles, sesiones y sesión activa llevan `forestId`.
- **Persistencia V4:** migración de datos viejos a un bosque “Mi bosque” 8×8; sin datos viejos no se crea un bosque falso. El estado inicial muestra la pradera 8×8 de fondo con la tarjeta de bienvenida. V4 agrega las sesiones planificadas.
- **Creación:** diálogo con nombre, descripción, tamaño en un select con capacidad, fecha opcional con calendario propio y contador, meta de horas y vista previa con el atlas real. Se abre desde la bienvenida o desde Iniciar si todavía no hay bosque.
- **Identidad visible:** la cabecera muestra el nombre del bosque y el contador de días. Los toggles para ocultarlos ya existen en el modelo (`display`) y se conectarán en Ajustes.
- **Estadísticas por bosque:** el timer, la tarjeta de sesión y Estadísticas filtran por el bosque activo; Estadísticas muestra totales globales cuando hay más de un bosque.
- **Pendiente de esta serie:** toggles de nombre/contador en Ajustes y vista por período (mes/semana/año). Edición, archivado, eliminación, cambio de bosque e historial por bosque ya están implementados.

### Sesiones e historial: implementado en esta etapa

- **Sesión planificada (`SessionPlan`):** título, descripción, objetivos y uno o varios pomodoros (hasta 8). Cada pomodoro copia esos datos y guarda `planId`, `pomoIndex` y `pomoTotal` en su `FocusRecord`; los árboles de la serie no se fuerzan adyacentes.
- **Iniciar:** abre un diálogo con nombre, descripción, objetivos y modo “Un pomodoro” / “Varios pomodoros”, con contador y resumen de minutos, pausas y árboles. Si no hay bosque, primero se crea uno.
- **Serie pendiente:** tras completar un pomodoro intermedio, el timer ofrece continuar la serie o empezar otra; empezar otra cierra la anterior. Abandonar cierra la serie completa.
- **Historial por bosque:** ventana flotante con filtros Todas, Hoy, Esta semana, Series y Marchitas; agrupa los pomodoros por sesión, muestra fecha, minutos, estado y árboles (incluidos los marchitos). La card se corta antes del borde inferior de la pantalla y solo su lista scrollea, con una barra delicada visible al acercar el puntero al borde derecho; la columna no scrollea. La tarjeta de detalle replica la de la sesión activa y agrega fecha de fin, total de enfoque y estado. Con un pomodoro en curso también se puede elegir una sesión: el detalle se despliega debajo de la tarjeta del timer.
- **Selección en la pradera:** elegir una sesión (en el historial o con doble clic en un árbol/celda) muestra todos sus árboles a opacidad normal y atenúa el resto; la cámara se centra una vez en la selección. No modifica timer, árboles ni datos.

### Después

- **v0.2:** economía y semillas, edición del jardín (colocar, mover, quitar), parcelas por desbloquear, varios bosques y especies.
- **v0.3:** cuenta y sincronización con Supabase, PWA, gráficos por período.
- **v0.4 y v0.5:** álbum de bosques, bosques compartidos y salas en vivo.
- **v1.0:** aldea, estructuras y estaciones.

## 7. Estructura de archivos

La idea central: la **lógica** (timer, crecimiento, estadísticas) va separada del **dibujo** y de la **interfaz**. Así se puede probar la lógica sola y cambiar el aspecto sin romper nada.

```
focus-forest/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  CONTEXTO.md              reglas del proyecto (para el agente)
  FICHA_v0.1.md            alcance y criterios de aceptación
  LICENSES.md              licencias de fuentes y arte
  README.md                cómo instalar y correr
  docs/
    PLAN.md                este plan y guía de estilo
    THEMING.md             sistema de tema visual
  public/
    sprites/pino_atlas.png  4 frames vivos
    sprites/pino_atlas.json  frames vivos
    sprites/pino_muerto_atlas.png  4 frames marchitos
    sprites/pino_muerto_atlas.json frames marchitos
  src/
    main.tsx               arranque de la app
    App.tsx                pantalla principal
    index.css              Tailwind, base y clases de componentes
    styles/
      theme.css            paleta, tipografías y tokens del tema
    config/
      grid.ts              8×8, celda 60×30, escena 480×400
      timer.ts             25 y 5 minutos
      growth.ts            umbrales 0/5/15/25
      session.ts           límites de sesión (título, objetivos, pomodoros)
      zoom.ts              0.5×–2×, escalas enteras y formato
    state/
      types.ts             forma de los datos
      store.ts             estado de la app
      persist.ts           versión de esquema y migraciones
      selectors.ts         estadísticas derivadas
    logic/
      timer.ts             restante, pausa, reanudar, vencimiento
      growth.ts            minutos → etapa
      stats.ts             hoy y totales
      history.ts           agrupación y filtros del historial
      placement.ts         siguiente celda libre aleatoria, sin espaciamiento
      day.ts               día local
      zoom.ts              límites, escala base entera, niveles enteros y formato
    render/
      iso.ts               de celda a pantalla, orden de dibujo y celda por punto
      sprites.ts           carga de los atlas y dibujo/medición de frames
      drawGarden.ts        dibuja la pradera, los árboles y la selección
    hooks/
      useCountdown.ts      tick de 0.5 s para la interfaz
    components/
      GardenCanvas.tsx     canvas, arrastre, zoom, doble clic y selección
      TimerPanel.tsx       timer, botones e inicio de sesión
      SessionCard.tsx      tarjeta de la sesión actual
      SessionCreateDialog.tsx  diálogo de nueva sesión
      SessionDetailCard.tsx    datos de una sesión pasada
      HistoryPanel.tsx     ventana flotante con la lista y los filtros del historial
      StatsPanel.tsx       estadísticas
      BreakPrompt.tsx      oferta de descanso
      CompletionToast.tsx  aviso al completar
      ConfirmDialog.tsx    confirmación al abandonar
    tests/
      growth.test.ts
      timer.test.ts
      stats.test.ts
      placement.test.ts
      zoom.test.ts
      history.test.ts
      iso.test.ts
      persist.test.ts
```

## 8. Puesta en marcha

El proyecto ya está creado en `focus-forest/`. Para levantarlo:

```
cd focus-forest
npm install
npm run dev
```

Comandos:

```
npm run dev       servidor de desarrollo
npm run build     chequeo de tipos + build de producción
npm run preview   sirve el build
npm run lint      oxlint
npm test          Vitest
```

En Windows, si PowerShell bloquea `npm.ps1`, usar `npm.cmd`:

```
npm.cmd install
npm.cmd run dev
```

Si hiciera falta recrear el proyecto desde cero:

```
npm create vite@latest focus-forest -- --template react-ts
cd focus-forest
npm install zustand @fontsource/nunito @fontsource/quicksand
npm install -D tailwindcss @tailwindcss/vite vitest prettier
```

Notas de versión: el template actual usa Vite 8, React 19, TypeScript 7 y **oxlint** (no ESLint). Tailwind v4 se configura con el plugin `@tailwindcss/vite` y `@import "tailwindcss";` en el CSS; no hace falta `tailwind.config.js`.

## 9. Guía de estilo

### Paleta

Sale de los colores dominantes de la pradera de referencia. Verificar el contraste de cada texto (mínimo 4,5 a 1) al implementarlo. Los valores viven en `src/styles/theme.css`; `src/index.css` los registra en Tailwind.

| Rol | Color | Uso |
| --- | --- | --- |
| Texto principal y contornos | #203f3b | Bosque profundo |
| Primario | #3a684f | Botón principal; el texto sobre él va en crema |
| Activo y progreso | #548952 | Hover, barra de progreso |
| Acento | #8db65d | Detalles e íconos, estados correctos |
| Texto secundario | #566d47 | Etiquetas y descripciones |
| Superficie | #c8cc93 | Paneles y tarjetas |
| Fondo claro | #e9edd0 | Fondo de la página |
| Madera y bordes | #8b644a | Marcos, árbol marchito |
| Corteza | #554736 | Bordes fuertes y sombras |
| Acento especial | #e589ae | Cerezo: solo para rarezas y logros, con mucha moderación |

Modo oscuro: fuera de la v0.1. Fondo #203f3b con texto #e9edd0, para más adelante.

### Tipografía

- **Nunito** para textos, títulos y números; **Quicksand 600** para botones y controles. Sin pixel fonts en el DOM.
- El timer usa Nunito en tamaño grande y peso 700, con dígitos de ancho fijo (`font-variant-numeric: tabular-nums`). Texto mínimo de 16 px en el cuerpo; las etiquetas micro pueden ser menores.
- Ambas fuentes se sirven desde `@fontsource`, sin CDN.

### Forma y movimiento

- Esquinas de 12 a 16 px, bordes finos translúcidos, sombras muy tenues y sin degradados salvo el anillo del temporizador. Nada de marcos duros ni recortes escalonados en el DOM.
- Íconos de línea simple de 16 a 24 px, con el trazo del tema; no dependen de una librería externa.
- La pradera usa escala base entera (1×, 2×…) y `image-rendering: pixelated`; el zoom también se mantiene en escalas enteras. El canvas interno se ajusta a píxeles físicos.
- Animaciones de 200 a 450 ms, sin rebotes ni parpadeos, respetando `prefers-reduced-motion`.
- Sonido apagado por defecto; en la v0.1 no hay sonido.

### Composición de la pantalla

- **Escritorio:** diorama de 960×800 centrado (2× de la escena 480×400), con la tarjeta de sesión a la izquierda y el timer a la derecha. Las tarjetas se anclan a 16 px de los bordes de la ventana y crecen con el ancho de la pantalla; el timer es más ancho que la tarjeta de sesión. La pradera es el centro; los paneles no compiten con ella.
- **Historial:** ventana flotante en la columna izquierda, debajo de la tarjeta de sesión, con filtros y la lista apilada. La card se corta antes del borde inferior y solo la lista scrollea; la columna no. El detalle de la sesión aparece en la misma columna y, si hay un pomodoro en curso, debajo de la tarjeta del timer. En pantallas chicas la columna pasa al flujo normal sobre el timer.
- **Durante una sesión:** el selector de vistas se deshabilita; vuelve a aparecer la tarjeta de sesión con el crecimiento en vivo, y timer, pausa y abandonar siguen a mano.
- **Mobile:** fuera del alcance de la v0.1. La app no debe romperse a 360 px, pero el layout completo se diseña después. Una pradera isométrica 2:1 es una banda ancha; no puede ocupar el 80 % de una pantalla vertical sin recortar o hacer zoom.
- **Lenguaje amable:** nada de mensajes de castigo; al abandonar, un aviso sereno.

### Qué evitar

- Colores saturados fuera de la paleta (rojos, azules y violetas intensos).
- Degradados en botones o tarjetas, sombras difusas fuertes y estética genérica de app moderna.
- Tipografía pixel y marcos duros en el DOM.
- Íconos de librerías genéricas que no sigan el trazo del tema.
- Ventanas emergentes que interrumpan el enfoque.
- Sprites nuevos que no usen la paleta ni el contorno oscuro de los actuales.

### Revisión de cada pantalla nueva

Antes de darla por buena, se compara con la pradera de referencia y se comprueba: paleta, tipografía, bordes, movimiento y que nada compita con la pradera.

## 10. Riesgos y temas abiertos

- **Nombre:** "Focus Forest" se parece a la app Forest. Para publicar o monetizar conviene un nombre más distintivo. No bloquea el desarrollo.
- **Arte:** los assets actuales son los sprites de `public/sprites/`; si se usa un arte final, debe ser propio o encargado, con licencia clara; registrar todo en `LICENSES.md`.
- **Mobile:** el layout completo queda para después. Cuando se encare, decidir entre escala 1× o una vista recortada.
- **Grilla llena:** con 64 árboles adultos no entra una sesión nueva. Los marchitos se reemplazan por el más viejo; si solo hay adultos, se muestra un aviso. Las parcelas nuevas llegan en la v0.2.
- **Alcance:** no sumar funciones fuera de la ficha v0.1 hasta cerrarla.

## 11. Próximos pasos

| Fase | Entregable |
| --- | --- |
| 0. Documentos | plan actualizado, `FICHA_v0.1.md`, `CONTEXTO.md` |
| 1. Andamiaje | Vite, Tailwind, Vitest, oxlint/Prettier, CI |
| 2. Dominio | tipos, configuración, timer, crecimiento, estadísticas, colocación y pruebas |
| 3. Render | isometría, isla, atlas de sprites, `drawGarden` |
| 4. Estado | store, persistencia v1, migración, selectores |
| 5. Interfaz | Bosque, Estadísticas, timer, tarjeta, aviso y descanso |
| 6. Pulido | accesibilidad, contraste, movimiento reducido, tema centralizado, zoom, README y publicación |
