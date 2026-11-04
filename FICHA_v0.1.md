# Ficha v0.1 — Focus Forest

Documento de alcance y aceptación de la primera versión. Si algo no está acá, no entra en la v0.1 sin hablarlo antes.

## 1. Objetivo

Una app web de escritorio donde una persona completa pomodoros de 25 minutos y ve crecer un pino en una pradera isométrica. Completar una sesión deja un árbol adulto; abandonarla deja la versión marchita de la etapa alcanzada. Todo se guarda en el navegador.

## 2. Alcance

| Entra | No entra |
| --- | --- |
| Enfoque fijo de 25 minutos | Duraciones 15/45/60 o personalizadas |
| Descanso fijo de 5 minutos, ofrecido con botón | Descanso largo o ciclo automático |
| Un árbol por sesión completada | Árbol acumulativo entre sesiones |
| 4 etapas: brote, joven, maduro, adulto | Especies extra, rarezas, semillas |
| Pradera 8×8 con isla flotante | Editar, mover o quitar árboles; parcelas bloqueadas |
| Zoom de vista de la pradera (0.5×–2×) | Ajustes de usuario, modo oscuro, selector de temas |
| Pausa, reanudar y abandonar | Tienda, monedas, economía |
| Estadísticas de hoy y totales | Gráficos, rachas, calendario, metas |
| Guardado local con versión | Cuentas, Supabase, sincronización |
| Contador "Pomodoros hoy: N" | Meta diaria fija o configurable |
| Aviso al completar | Sonido, notificaciones del navegador |
| Vista Bosque y vista Estadísticas | Ajustes, modo oscuro, PWA, álbum |
| Una especie: pino, 4 etapas vivas + 4 marchitas | Tres especies |
| Escritorio primero | Layout mobile completo |

## 3. Flujo

1. **Inicio:** pradera centrada, timer en 25:00, botón **Iniciar** y contador "Pomodoros hoy: N".
2. **Empezar enfoque:** se reserva la siguiente celda libre y aparece el brote. El timer corre.
3. **Crecimiento:** a los 5 minutos el árbol es joven, a los 15 maduro y a los 25 adulto. El canvas se redibuja solo al cambiar de etapa.
4. **Completar:** el árbol adulto queda en la pradera, se registra la sesión, aparece un aviso y se ofrece **Empezar descanso** o **Saltar**.
5. **Descanso:** timer de 5:00, sin árbol. Se puede pausar o saltar. Al terminar, vuelve al inicio.
6. **Abandonar:** pide confirmación; el árbol queda marchito con la variante de su etapa, no acredita minutos y no hay mensaje de castigo.
7. **Recargar:** si el enfoque sigue corriendo, se reanuda; si ya venció, se completa. Si el descanso venció, se cierra.
8. **Zoom:** la pradera se puede acercar o alejar entre 0.5× y 2× con el slider, los botones o la rueda del mouse. Es una vista de sesión: no cambia el timer, los árboles ni los datos guardados.

## 4. Modelo de datos

```ts
type TreeStage = 1 | 2 | 3 | 4;

interface Cell {
  col: number;
  row: number;
}

interface Tree {
  id: string;
  sessionId: string;
  cell: Cell;
  stage: TreeStage;
  state: 'mature' | 'withered';
  createdAt: number; // epoch ms
}

interface ActiveSession {
  id: string;
  kind: 'focus' | 'break';
  startedAt: number;
  endsAt: number;
  durationMin: number; // 25 o 5
  pausedAt: number | null;
  pausedMs: number;
  cell: Cell | null; // solo en focus
}

interface FocusRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMin: 25;
  status: 'completed' | 'abandoned';
  treeId: string;
}

interface PersistedV1 {
  version: 1;
  trees: Tree[];
  sessions: FocusRecord[];
  active: ActiveSession | null;
}
```

Los descansos no se guardan como historial: solo existe el descanso activo. Las estadísticas se derivan de `sessions` y `trees`.

## 5. Reglas

- **Tiempo:** todo en epoch ms. El restante se calcula con `endsAt - now`; nunca se resta un contador. La pausa corre `endsAt` y no cuenta como enfoque.
- **Día local:** "hoy" se calcula con los getters locales de `Date`, nunca con `toISOString()`.
- **Etapas:** `0 → 1`, `5 → 2`, `15 → 3`, `25 → 4`. Una sesión de enfoque completada siempre termina en etapa 4.
- **Colocación:** centro hacia afuera. Los marchitos ocupan celda. Si la grilla se llena, se reemplaza el marchito más viejo; si solo hay adultos, se bloquea el inicio con un aviso.
- **Persistencia:** clave `focus-forest`, versión 1, migración preparada. Datos corruptos: copia de respaldo y reinicio. Versión más nueva: aviso, sin borrar.
- **Estadísticas:** solo enfoques completados. "Hoy" usa `endedAt` en día local. Los abandonos y los descansos no suman.
- **Canvas:** nominal 1024×832 CSS (escena lógica 512×416: grilla 512×256 + 128 de margen superior + 32 de tierra), escala base 2×, sin suavizado, redibujo al cambiar etapa, árboles o zoom. Se dibuja con un margen de 2× (2048×1664) para que el zoom máximo no corte la isla en los bordes.
- **Zoom:** rango 0.5×–2×, centrado en la escena; se controla con slider, botones o rueda del mouse; no se guarda y no modifica el estado de la sesión.
- **Sin dependencias extra:** nada de router, librería de gráficos, motor de juego, Supabase ni PWA en la v0.1.

## 6. Criterios de aceptación

- [ ] Iniciar, pausar, reanudar y abandonar (con confirmación) funcionan.
- [ ] Abandonar deja el árbol marchito de su etapa y no suma minutos.
- [ ] Las etapas aparecen a los 5, 15 y 25 minutos; el canvas no se redibuja cada segundo.
- [ ] Completar deja un árbol adulto, muestra el aviso y ofrece el descanso.
- [ ] El descanso dura 5 minutos, se puede saltar y no planta árbol ni suma estadísticas.
- [ ] Recargar a mitad de enfoque reanuda; si venció, completa; si el descanso venció, cierra.
- [ ] "Hoy" y los totales cuentan solo enfoques completados, con el día local correcto.
- [ ] El jardín se llena de centro hacia afuera; con 64 adultos avisa que está lleno.
- [ ] Recargar conserva jardín, sesión y estadísticas; datos corruptos no rompen la app.
- [ ] En 1440×900 se ve el layout de escritorio sin scroll horizontal; a 360 px no se rompe.
- [ ] El zoom de la pradera funciona entre 0.5× y 2× sin afectar el timer ni el estado, y la isla puede desbordar el recuadro sin cortarse.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.
- [ ] Sin errores de consola; publicado en Vercel.

## 7. Casos borde

- **Enfoque vencido mientras la pestaña estaba cerrada:** se completa al volver, con el árbol adulto.
- **Descanso vencido mientras la pestaña estaba cerrada:** se cierra sin aviso.
- **Pausa y recarga:** el restante no avanza mientras está pausado.
- **Grilla llena de adultos:** no se puede iniciar; aviso claro.
- **Grilla llena con marchitos:** el nuevo árbol reemplaza al marchito más viejo.
- **Datos corruptos o versión desconocida:** respaldo y reinicio, o aviso sin borrar.
- **localStorage bloqueado:** estado en memoria y aviso; la app sigue usable.
- **Atlas no disponible:** se dibuja un placeholder sin errores de consola, sin pantalla en blanco.
- **Cambio de hora del sistema:** fuera de alcance; no se compensa.

## 8. Definición de terminado

- Criterios de aceptación cumplidos.
- Lógica pura cubierta por tests.
- `lint`, `test` y `build` verdes.
- README y `CONTEXTO.md` actualizados.
- Sin `console.log` de depuración.
- Deploy de Vercel funcionando.
