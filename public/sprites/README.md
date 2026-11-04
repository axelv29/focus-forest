# Sprites

Acá van los assets finales del pino.

## Assets

- `pino_atlas.png` + `pino_atlas.json`: los 4 frames de árboles vivos.
- `pino_muerto_atlas.png` + `pino_muerto_atlas.json`: los 4 frames de árboles marchitos.
- `pastosprite.png`: cubo de pasto; el render usa solo su cara superior de `64×32` en cada celda.

## Frames

El render normaliza los nombres a:

| Etapa | Vivo | Marchito |
| --- | --- | --- |
| Brote | `tree.brote` | `tree.brote.withered` |
| Joven | `tree.joven` | `tree.joven.withered` |
| Maduro | `tree.maduro` | `tree.maduro.withered` |
| Adulto | `tree.adulto` | `tree.adulto.withered` |

- En los atlas de origen, los frames vivos se nombran con `pino_<etapa>_*`.
- Los frames marchitos se nombran con `pino_muerto_<etapa>_*`.
- El loader usa el número de etapa para mapear `1 → Brote`, `2 → Joven`, `3 → Maduro` y `4 → Adulto`.

## Dimensiones y anclaje

- Ambos atlas miden `122×92` px.
- Los frames se dibujan a su tamaño nativo en la escena lógica, sin escalar el atlas completo.
- El anclaje se lee de cada frame y marca la base del tronco; la sombra pixelada queda dentro del frame y puede sobresalir por debajo del ancla.
- El adulto mide `44×89`; el brote `13×13`.
- La escena lógica sigue usando celda `64×32` y escala base `2×`.

## Activación

- `SPRITES_ENABLED = true` en `src/render/sprites.ts`.
- Si falta un asset o un frame, `loadAtlas` devuelve `null` y el render usa los placeholders dibujados por código.

## Licencia

- No usar hojas de terceros sin una licencia compatible. Registrar todo en `LICENSES.md`.
