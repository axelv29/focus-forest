# Ficha v2 — Focus Forest

Documento de alcance y aceptación de la segunda versión. Si algo no está acá, no entra en la v2 sin hablarlo antes.

## 1. Objetivo

Una app web de escritorio donde una persona completa pomodoros y ve crecer un bosque en una pradera isométrica, ahora con bosques personalizados por finalidad, sesiones con contexto, historial por árbol y ajustes de foco más finos.

## 2. Alcance

| Entra | No entra |
| --- | --- |
| Bosques personalizados: varios bosques por usuario, cada uno con el fin que quiera (p. ej. un bosque pequeño de 4×4 para estudio de un mes, un bosque grande para un semestre, o uno que solo trate una materia). | Cuentas, Supabase, sincronización. |
| Bosques de tamaño variable: fijos desde 3×3 o 4×4 hasta 8×8. | Tienda, monedas, economía. |
| Nuevos tipos de árboles / sprites, con versiones extra de maduración y seteado fácil para agregar futuros sprites y tipos de árboles sin tocar la lógica de crecimiento. | Ajustes de usuario, modo oscuro, PWA, álbum. |
| Más tiempo en el pomodoro, ligado a los nuevos árboles; decisión tomada: especie según la duración elegida (duración → especie), etapas proporcionales a la duración, una sesión = un árbol. La escalera concreta de especies es una sugerencia, no algo definitivo (ver §5 y §8). | Meta diaria fija o configurable. |
| Menú nuevo para elegir el tiempo y los ajustes del pomodoro: tiempo de estudio y tiempo de descanso, además descanso largo tras 4 sesiones de pomodoro, que suene una pequeña alarma con 3 tonos predefinidos que puedan cambiarse y que llegue una notificación del navegador cuando sonó; todo esto modificable en la nueva ventana de ajustes que irá al costado de las ya existentes estadísticas y bosque. | Guardado en servidor. |
| Sesiones nuevas con título y descripción que aparece en la card de información básica de la sesión, un texto corto que permita explicar brevemente qué se tratará en la sesión o incluso admita el uso de checkboxes para agregar tareas. | Gráficos, rachas, calendario, metas. |
| Selección de una sesión al tocar cualquier árbol, que de información del mismo parecido a la card de la sección actual pero con algunos datos referentes a la sesión seleccionada pasada. | ... |
| En cada bosque una pestaña de historial de sesiones con información breve relevante, y cada vez que se toque algún árbol del historial muestre la sesión correspondiente. | ... |
| Árbol seleccionado: se prefiere opacidad distinta, bajando la de los demás árboles y dejando al 100% solo el árbol seleccionado; la alternativa (borde destacado en la grilla) queda descartada por ahora. | ... |
| Pausa: cuando se pausa una sesión no pasa nada, pero si se cierra la página aparezca un mensaje diciendo que al cerrar la página sería como abandonar y el árbol quedará marchito; se agrega además una opción de pausa estricta al crear la sesión que haga que no se pueda pausar el pomodoro, y si se pausa que sea lo mismo que abandonarlo, con una opción extra activable o no que permita tener cierto tiempo antes que el árbol se marchite si está pausado (p. ej. 5 minutos); ese tiempo sea el mismo para toda la sesión, es decir, si pause una vez y gaste 3 minutos, luego podré volver a pausar pero solo con 2 minutos restantes en el contador de pausa. | ... |

Además, de lo ya conocido y no absorbido en el alcance nuevo: guardado local con versión, avisos de datos corruptos / versión futura / storage bloqueado, HUD con selector Bosque / Estadísticas, pradera con zoom y drag, y los criterios de v0.1.

## 3. Flujo

1. **Inicio:** pradera centrada, timer en el tiempo configurado, botón **Iniciar** y contador "Pomodoros hoy: N".
2. **Nueva sesión:** al empezar una sesión se le puede poner título y descripción (+ tareas con checkboxes).
3. **Empezar enfoque:** se reserva la siguiente celda libre y aparece el brote del tipo de árbol correspondiente. El timer corre.
4. **Crecimiento:** las versiones extra de maduración del árbol se van alcanzando con los tiempos del tipo; el canvas se redibuja solo al cambiar de etapa.
5. **Completar:** el árbol termina en la etapa correspondiente de su tipo, se registra la sesión, aparece el aviso y se ofrece el descanso.
6. **Descanso:** con los ajustes del menú (tiempo de descanso, descanso largo tras 4 pomodoros, alarma con 3 tonos + notificación del navegador); se puede saltar.
7. **Abandonar:** pide confirmación; el árbol queda marchito con la variante de su etapa, no acredita minutos y no hay mensaje de castigo.
8. **Pausa:** normal o estricta; si hay tolerancia configurada, el árbol solo marchita pasado el tiempo de tolerancia; el cierre de página con sesión activa se trata como abandono con mensaje.
9. **Recargar:** si el enfoque sigue corriendo, se reanuda; si ya venció, se completa. Si el descanso venció, se cierra.
10. **Zoom:** la pradera se puede acercar o alejar (según el rango vigente) con botones flotantes o la rueda; es una vista de sesión.
11. **Selección:** tocar un árbol muestra la información de su sesión (pasada); en el historial, tocar un árbol muestra su sesión correspondiente.

## 4. Modelo de datos

```ts
type TreeKind = string; // nuevos tipos: pino, abeto, roble, etc.

interface Cell {
  col: number;
  row: number;
}

interface Tree {
  id: string;
  sessionId: string;
  cell: Cell;
  kind: TreeKind;
  stage: TreeStage;
  state: 'mature' | 'withered';
  createdAt: number; // epoch ms
}

interface Session {
  id: string;
  title: string | null;
  description: string | null;
  tasks: string[];
  createdAt: number;
}

interface ActiveSession {
  id: string;
  kind: 'focus' | 'break';
  startedAt: number;
  endsAt: number;
  durationMin: number; // configurable o fijo por árbol
  pausedAt: number | null;
  pausedMs: number;
  cell: Cell | null; // solo en focus
  strictPause: boolean; // v2
  pauseToleranceMin: number; // v2
}

interface FocusRecord {
  id: string;
  sessionId: string;
  startedAt: number;
  endedAt: number;
  durationMin: number;
  status: 'completed' | 'abandoned';
  treeId: string;
}

interface PersistedV2 {
  version: 2;
  // ... árboles, sesiones, historial, ajustes del pomodoro
}
```

## 5. Reglas

- **Tiempo:** todo en epoch ms. El restante se calcula con `endsAt - now`; nunca se resta un contador. Los descansos y el descanso largo salen de los ajustes del pomodoro.
- **Día local:** "hoy" se calcula con los getters locales de `Date`, nunca con `toISOString()`.
- **Etapas:** `0 → 1`, `5 → 2`, `15 → 3`, `25 → 4` para el pino; los nuevos tipos pueden tener versiones extra de maduración (más etapas o tiempos distintos por tipo). Una sesión completada termina en la etapa correspondiente de su tipo.
- **Tiempo por árbol (decisión tomada, 2026-11-08):** duración → especie; las etapas de crecimiento son proporcionales a la duración de la sesión (p. ej. 0/20/60/100 %). La especie de la sesión completada termina en la etapa correspondiente de su tipo. Una sesión planta un árbol. Tiempos personalizados: la especie del bloque más cercano por debajo, o pino como base. La escalera duración → especie propuesta es una sugerencia, no definitiva: 15 min → Abedul, 25 min → Pino, 45 min → Abeto, 60 min → Roble, 90 min → Secuoya, 120 min → Cerezo (acento especial de la paleta, reservado a rarezas). Puede haber después varias especies con el mismo tiempo, u otros elementos (flores, cosméticos), sin tocar la lógica. Registro de especies en `config` (id, nombre, sprites, umbrales por especie opcionales, minutos del bloque).
- **Descanso largo:** tras N sesiones de pomodoro completadas (p. ej. 4), se ofrece o inicia un descanso largo con su alarma.
- **Alarma:** 3 tonos predefinidos editables + notificación del navegador al sonar.
- **Pausa estricta:** no se puede pausar; si se pausa, se trata como abandono. Con tolerancia activable, el árbol solo marchita pasado el tiempo de tolerancia; ese tiempo es el mismo para toda la sesión.
- **Persistencia:** clave `focus-forest`, versión 2, migración preparada. Datos corruptos: copia en `focus-forest.broken` y reinicio, con aviso. Versión más nueva: aviso y escrituras bloqueadas, sin borrar ni modificar el guardado. Almacenamiento bloqueado o lleno: aviso y estado solo en memoria.
- **Estadísticas:** solo enfoques completados. "Hoy" usa el día local. Los abandonos y los descansos no suman.

## 6. Criterios de aceptación

- [ ] Los nuevos tipos de árboles y versiones extra de maduración están seteados, con seteado fácil para futuros sprites y tipos.
- [ ] El tiempo del pomodoro es el nuevo (ligado a los nuevos árboles) y está seteado en el menú; la decisión de tiempo por árbol (duración → especie, etapas proporcionales) está tomada y registrada en §5; la escalera concreta de especies queda como sugerencia.
- [ ] El menú de tiempo y ajustes del pomodoro funciona: estudio, descanso, descanso largo, alarma con 3 tonos editables + notificación del navegador, en la ventana de ajustes junto a estadísticas y bosque.
- [ ] Los bosques personalizados y los bosques de tamaño variable (3×3 a 8×8) funcionan.
- [ ] Las sesiones nuevas permiten título y descripción (+ tareas con checkboxes).
- [ ] El historial por bosque con selección por árbol muestra la sesión correspondiente.
- [ ] El árbol seleccionado se ve con opacidad distinta.
- [ ] La pausa estricta, la tolerancia antes del marchitaje y el cierre de página ≈ abandono con mensaje están implementados.
- [ ] `npm run lint`, `npm test` y `npm run build` en verde; sin errores de consola; mobile ≥360 px sin romperse.

## 7. Casos borde

- **Cierre de página con pausa activa y tolerancia no agotada:** no pasa nada; el árbol no marchita.
- **Cierre de página con pausa activa y tolerancia agotada:** se trata como abandono, el árbol queda marchito y se muestra el mensaje.
- **Pausa estricta:** no se puede pausar; pausar equivale a abandonar.
- **Descanso largo:** sin árbol, con su alarma y notificación.
- **Alarma sin notificación del navegador concedida:** se usa el sonido; se informa al usuario.
- **Bosque personalizado lleno:** regla de reemplazo de marchitos aplicada.
- **Sesión pausada:** el restante no avanza; con tolerancia, el marchitaje ocurre pasado el tiempo.

## 8. Definición de terminado

- Criterios de aceptación cumplidos.
- Lógica pura cubierta por tests.
- `lint`, `test` y `build` verdes.
- README y `CONTEXTO.md` actualizados.
- Sin `console.log` de depuración.
- Deploy de Vercel funcionando.

Pendiente de decidir antes del cierre: la escalera definitiva de especies (la propuesta en §5 es una sugerencia) y la tolerancia exacta de la pausa estricta. Decidido: duración → especie, etapas proporcionales, una sesión = un árbol.
