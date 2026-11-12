# Ficha v0.1 — Focus Forest

Documento de alcance y aceptación de la primera versión. Si algo no está acá, no entra en la v0.1 sin hablarlo antes.

## 1. Objetivo

Una app web de escritorio donde una persona completa pomodoros de 25 minutos y ve crecer un pino en una pradera isométrica. Completar una sesión deja un árbol adulto; abandonarla deja la versión marchita de la etapa alcanzada. Una sesión puede ser un pomodoro suelto o una serie de hasta 8 con un objetivo propio, y el historial del bosque reúne los árboles de cada serie. Todo se guarda en el navegador.

## 2. Alcance

| Entra | No entra |
| --- | --- |
| Enfoque fijo de 25 minutos | Duraciones 15/45/60 o personalizadas |
| Descanso fijo de 5 minutos, ofrecido con botón | Descanso largo o ciclo automático |
| Un árbol por sesión completada | Árbol acumulativo entre sesiones |
| Sesión de 1 a 8 pomodoros con nombre, descripción y objetivos | Series con reglas de negocio complejas o encadenado automático |
| Historial por bosque con filtros y árboles marchitos | Historial global entre bosques o exportación |
| 4 etapas: brote, joven, maduro, adulto | Especies extra, rarezas, semillas |
| Pradera 8×8 con isla flotante | Editar, mover o quitar árboles; parcelas bloqueadas |
| Zoom de vista de la pradera (0.5×–2×; mínimo 1× en desktop) | Ajustes de usuario, modo oscuro, selector de temas |
| Pausa, reanudar y abandonar | Tienda, monedas, economía |
| Estadísticas de hoy y totales | Gráficos, rachas, calendario, metas |
| Guardado local con versión | Cuentas, Supabase, sincronización |
| Contador "Pomodoros hoy: N" | Meta diaria fija o configurable |
| Aviso al completar | Sonido, notificaciones del navegador |
| Vistas Bosque, Estadísticas y Bosques + historial flotante | Ajustes, modo oscuro, PWA, álbum |
| Una especie: pino, 4 etapas vivas + 4 marchitas | Tres especies |
| Escritorio primero | Layout mobile completo |

## 3. Flujo

1. **Inicio:** pradera centrada del bosque activo (la primera vez, "Mi bosque"), timer en 25:00, botón **Iniciar** y contador "Pomodoros hoy: N".
2. **Empezar sesión:** el botón abre un diálogo con nombre, descripción, objetivos y la elección entre un pomodoro o una serie de hasta 8. Al confirmar se reserva la primera celda libre y aparece el brote.
3. **Crecimiento:** a los 5 minutos el árbol es joven, a los 15 maduro y a los 25 adulto. El canvas se redibuja solo al cambiar de etapa.
4. **Completar:** el árbol adulto queda en la pradera, se registra el pomodoro y aparece un aviso. Si la serie tiene más pomodoros, se ofrece **Continuar**; si terminó, se cierra. También se ofrece el descanso.
5. **Descanso:** timer de 5:00, sin árbol. Se puede pausar o saltar. Al terminar, vuelve al inicio.
6. **Abandonar:** pide confirmación; el árbol queda marchito con la variante de su etapa, registra los minutos de enfoque reales (sin pausas) que estuvo la sesión antes de abandonar, cierra la serie y no hay mensaje de castigo.
7. **Historial:** se abre con un botón discreto de la tarjeta del timer y aparece como ventana flotante a la izquierda, debajo de la tarjeta de sesión. Agrupa los pomodoros por serie y muestra fecha, minutos, estado y árboles (incluidos los marchitos). La card se corta antes del borde inferior de la pantalla y solo su lista scrollea, con una barra fina que se ve al acercar el puntero al borde derecho. Al elegir una sesión, todos sus árboles se ven a opacidad normal y el resto se atenúa; la tarjeta de detalle muestra el inicio, el fin, el total de enfoque y el estado. Con un pomodoro en curso también se puede abrir el detalle de una sesión, que aparece debajo de la tarjeta del timer; el resto de los árboles, incluido el que está creciendo, se atenúa. La sesión en curso también se lista en el historial con estado "En curso".
8. **Recargar:** si el enfoque sigue corriendo, se reanuda; si ya venció, se completa. Si el descanso venció, se cierra. Una serie pendiente se puede continuar.
9. **Zoom:** la pradera se puede acercar o alejar entre 0.5× y 2× con tres botones flotantes (acercar, alejar, restablecer) o la rueda del mouse. Es una vista de sesión: no cambia el timer, los árboles ni los datos guardados. En desktop el mínimo es 1× si la escena ya entra a esa escala.

## 4. Modelo de datos

```ts
type TreeStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type TreeSpecies = 'pino' | 'abedul' | 'roble' | 'ceibo';

interface Cell {
  col: number;
  row: number;
}

interface Forest {
  id: string;
  name: string;
  description: string | null;
  size: 4 | 5 | 6 | 7 | 8;
  createdAt: number;
  endsOn: string | null; // YYYY-MM-DD local
  goalHours: number | null;
  archivedAt: number | null;
}

interface Tree {
  id: string;
  sessionId: string;
  forestId: string;
  cell: Cell;
  kind?: string; // especie; las sesiones viejas se leen como pino
  stage: TreeStage;
  state: 'mature' | 'withered';
  createdAt: number; // epoch ms
}

interface SessionPlan {
  id: string;
  forestId: string;
  title: string;
  description: string | null;
  tasks: string[];
  targetPomodoros: number; // 1–8
  completedPomodoros: number;
  createdAt: number;
  finishedAt: number | null; // se cierra al completar o abandonar
}

interface ActiveSession {
  id: string;
  forestId: string | null;
  kind: 'focus' | 'break';
  startedAt: number;
  endsAt: number;
  durationMin: number;
  pausedAt: number | null;
  pausedMs: number;
  cell: Cell | null; // solo en focus
  planId?: string | null;
  pomoIndex?: number;
  pomoTotal?: number;
  title?: string | null;
  description?: string | null;
  tasks?: string[];
}

interface FocusRecord {
  id: string;
  forestId: string;
  startedAt: number;
  endedAt: number;
  durationMin: number;
  status: 'completed' | 'abandoned';
  treeId: string;
  title?: string | null;
  description?: string | null;
  tasks?: string[];
  planId?: string | null;
  pomoIndex?: number;
  pomoTotal?: number;
}

interface PersistedV4 {
  version: 4;
  forests: Forest[];
  activeForestId: string | null;
  trees: Tree[];
  sessions: FocusRecord[];
  plans: SessionPlan[];
  active: ActiveSession | null;
  activePlanId: string | null;
  settings: PomodoroSettings;
  display: DisplaySettings;
}
```

Los descansos no se guardan como historial: solo existe el descanso activo. Las estadísticas y el historial se derivan de `sessions`, `plans` y `trees`; no se guardan contadores duplicados.

## 5. Reglas

- **Tiempo:** todo en epoch ms. El restante se calcula con `endsAt - now`; nunca se resta un contador. La pausa corre `endsAt` y no cuenta como enfoque.
- **Día local:** "hoy" se calcula con los getters locales de `Date`, nunca con `toISOString()`.
- **Etapas:** `0 → 1`, `5 → 2`, `15 → 3`, `25 → 4`. Una sesión de enfoque completada siempre termina en etapa 4.
- **Colocación:** aleatoria entre celdas libres, sin espaciamiento mínimo: la grilla admite hasta 64 árboles. Los marchitos ocupan celda. Si no quedan celdas libres, se reemplaza el marchito más viejo; si solo hay adultos, se bloquea el inicio con un aviso.
- **Persistencia:** clave `focus-forest`, versión 4, migración preparada. V3→V4 agrega `plans: []` y `activePlanId: null`; las sesiones viejas quedan como pomodoros sueltos. Datos corruptos: copia en `focus-forest.broken` y reinicio. Versión más nueva: aviso y escrituras bloqueadas, sin borrar ni modificar el guardado. Almacenamiento bloqueado o lleno: aviso y estado solo en memoria.
- **Series:** una serie se agrupa por `planId` y no exige adyacencia. Cada pomodoro completado suma uno a `completedPomodoros`; al llegar a `targetPomodoros` o al abandonar, la serie se cierra. Empezar una sesión nueva cierra la pendiente anterior.
- **Historial:** se deriva por bosque; agrupa por `planId ?? id` y no mezcla bosques. "Hoy" usa `endedAt` en día local y la semana empieza el lunes local.
- **Selección:** elegir una sesión resalta todos sus árboles y atenúa el resto (opacidad 0.32), sin marcas en la grilla; no modifica el store, el timer ni la persistencia. El doble clic usa el frame del atlas y, si no acierta, la celda isométrica.
- **Bosque inicial:** al arrancar sin datos se crea "Mi bosque" de 8×8 y queda activo, así que la primera pantalla no pide crear un bosque; la tarjeta central solo invita a crear otro desde **Bosques**. La migración usa el mismo bosque si no había ninguno, y si se borran todos vuelve a aparecer al recargar.
- **Anillo:** dentro del círculo, arriba del reloj, se muestra la posición de la serie (por ejemplo `3/5`) cuando la sesión tiene más de un pomodoro.
- **Estadísticas:** solo enfoques completados. "Hoy" usa `endedAt` en día local. Los abandonos y las sesiones en curso no suman; aunque el historial registra los minutos que estuvo enfocado cada abandono y los transcurridos de la en curso.
- **Canvas:** escena lógica 480×400 (grilla 480×240 + 128 de margen superior + 32 de tierra), con escala base entera (1×, 2×…) y canvas interno a píxeles físicos; 2× da 960×800 CSS. El zoom usa solo escalas enteras de origen, así que todos los niveles son pixel-perfect estrictos: los niveles posibles son 50, 100, 150 y 200 %. No hay niveles intermedios fraccionarios. La rueda avanza un nivel entero por giro (50→100→150→200) y acumula los deltas chicos de un trackpad. La pradera se puede arrastrar con un clic izquierdo normal desde cualquier zona libre de la página, sin cambiar el cursor; el diorama se centra verticalmente y el desplazamiento es simétrico desde ese centro. El recorrido escala con el zoom y con el desborde del canvas más 80 px de margen: en desktop, unos 80/150/289/529 px a los lados y 85/170/255/454 px en vertical para 50/100/150/200 %. La posición se guarda proporcional al límite para no saltar al cambiar de zoom. El botón de retícula restablece la vista y recentra. Sin suavizado, redibujo al cambiar etapa, árboles o tamaño/zoom. No hay margen de overscan: el canvas puede desbordar el contenedor y el zoom no baja de 1:1 cuando la escala base ya entra.
- **Zoom:** rango 0.5×–2×, centrado en la escena; se controla con tres botones flotantes o la rueda del mouse; no se guarda y no modifica el estado de la sesión. En desktop el mínimo es 1× si la escala base ya entra.
- **Sin dependencias extra:** nada de router, librería de gráficos, motor de juego, Supabase ni PWA en la v0.1.

## 6. Criterios de aceptación

- [x] Iniciar, pausar, reanudar y abandonar (con confirmación) funcionan.
- [x] Abandonar deja el árbol marchito de su etapa y registra los minutos enfocados antes de abandonar.
- [x] Las etapas aparecen a los 5, 15 y 25 minutos; el canvas no se redibuja cada segundo.
- [x] Completar deja un árbol adulto, muestra el aviso y ofrece el descanso.
- [x] El descanso dura 5 minutos, se puede saltar y no planta árbol ni suma estadísticas.
- [x] Recargar a mitad de enfoque reanuda; si venció, completa; si el descanso venció, cierra.
- [x] "Hoy" y los totales cuentan solo enfoques completados, con el día local correcto.
- [x] El jardín se llena aleatoriamente hasta ocupar las 64 celdas; con 64 adultos avisa que está lleno.
- [x] Recargar conserva jardín, sesión y estadísticas; datos corruptos no rompen la app.
- [x] En 1366×768 y 1440×900 se ve el layout de escritorio con el timer sobre la pradera sin scroll; a 360 px no se rompe.
- [x] El zoom de la pradera funciona con los botones y la rueda sin afectar el timer ni el estado, y la isla puede desbordar el recuadro sin cortarse.
- [x] Iniciar abre el diálogo de sesión con nombre, descripción, objetivos y 1–8 pomodoros.
- [x] Completar un pomodoro intermedio ofrece continuar la serie; abandonar cierra la serie completa.
- [x] El historial agrupa los pomodoros de una serie, incluye árboles marchitos y filtra por hoy, semana, series y marchitas.
- [x] Elegir una sesión (lista, árbol o celda con doble clic) resalta sus árboles y atenúa el resto sin tocar el store.
- [x] Con un pomodoro en curso se puede abrir el detalle de una sesión desde el historial y aparece debajo de la tarjeta del timer; el resto de los árboles, incluido el que crece, se atenúa. La sesión en curso se lista en el historial con estado "En curso".
- [x] Sin datos, la app abre directamente "Mi bosque" y el historial vive en una ventana flotante con scroll, no en una vista más.
- [x] La posición de la serie (`3/5`) se ve dentro del anillo arriba del reloj.
- [ ] Revisión visual del diálogo de sesión, el historial flotante y el switch de tres vistas en desktop y a 360 px.
- [x] `npm run lint`, `npm test` y `npm run build` pasan.
- [x] Sin errores de consola.
- [x] Publicado en Vercel.

## 7. Casos borde

- **Enfoque vencido mientras la pestaña estaba cerrada:** se completa al volver, con el árbol adulto.
- **Descanso vencido mientras la pestaña estaba cerrada:** se cierra sin aviso.
- **Pausa y recarga:** el restante no avanza mientras está pausado.
- **Grilla llena de adultos:** no se puede iniciar; aviso claro.
- **Grilla llena con marchitos:** el nuevo árbol reemplaza al marchito más viejo.
- **Serie con la pradera llena:** se cierra la serie y se avisa; no se pierde el historial anterior.
- **Doble clic sobre árboles superpuestos:** se elige el árbol más adelante; si hace falta, el historial sigue siendo la vía directa.
- **Datos corruptos:** copia de respaldo en `focus-forest.broken` y reinicio, con aviso.
- **Versión más nueva:** aviso y escrituras bloqueadas, sin borrar el guardado.
- **localStorage bloqueado:** estado en memoria y aviso; la app sigue usable.
- **Atlas no disponible:** se dibuja un placeholder sin errores de consola, sin pantalla en blanco. El atlas actual está en `public/sprites/`.
- **Cambio de hora del sistema:** fuera de alcance; no se compensa.

## 8. Definición de terminado

- Criterios de aceptación cumplidos.
- Lógica pura cubierta por tests.
- `lint`, `test` y `build` verdes.
- README y `CONTEXTO.md` actualizados.
- Sin `console.log` de depuración.
- Deploy de Vercel funcionando.
