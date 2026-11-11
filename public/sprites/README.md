# Sprites

Acá van los assets finales de los árboles.

## Assets

- `pino_atlas.png` + `pino_atlas.json`: los 4 frames de pinos vivos.
- `pino_muerto_atlas.png` + `pino_muerto_atlas.json`: los 4 frames de pinos marchitos.
- `abedul_vivo_atlas.png` + `abedul_vivo_atlas.json`: los 5 frames de abedules vivos (los que usa la app).
- `abedul_muerto_downscale_atlas.png` + `abedul_muerto_downscale_atlas.json`: los 5 frames de abedules marchitos (los que usa la app; el nombre "downscale" quedó de la versión anterior, hoy va a tamaño nativo).
- `robles_atlas.png` + `robles_atlas.json`: los 7 frames de robles vivos.
- `roble_muerto_atlas.png` + `roble_muerto_atlas.json`: los 7 frames de robles marchitos (los que usa la app).
- `tileset8x8.png`: suelo completo de la pradera 8×8; el render lo dibuja como una sola imagen, con escala base entera y zoom solo en escalas enteras.

## Bosques de distinto tamaño

- `tileset4x4.png` … `tileset8x8.png`: un sheet de suelo por tamaño de bosque (4×4 a 8×8 celdas por lado). Todos miden 487×270, con el rombo de pasto y la isla anclados abajo-centro en el mismo lienzo, así que el render dibuja el archivo completo del tamaño elegido, sin recortar ni escalar.
- El preview de tamaños vive en el panel dev (`Tamaño del bosque en celdas por lado`); el valor por defecto sigue siendo el 8×8.

## Frames

El render normaliza cada frame a la clave `especie.etapa.estado`:

| Especie | Etapas vivas | Etapas marchitas |
| --- | --- | --- |
| Pino | `pino.1.mature` … `pino.4.mature` | `pino.1.withered` … `pino.4.withered` |
| Abedul | `abedul.1.mature` … `abedul.5.mature` | `abedul.1.withered` … `abedul.5.withered` |
| Roble | `roble.1.mature` … `roble.7.mature` | `roble.1.withered` … `roble.7.withered` |

- En los atlas de origen, los frames vivos se nombran con `<especie>_<etapa>_*` y los marchitos con `<especie>_muerto_<etapa>_*`.
- El loader usa el número de etapa: pino `1 → Brote`, `2 → Joven`, `3 → Maduro`, `4 → Adulto`; abedul `1 → Brote`, `2 → Plantín`, `3 → Joven`, `4 → Maduro`, `5 → Adulto`; roble `1 → Brote`, `2 → Plantín`, `3 → Joven`, `4 → Maduro`, `5 → Grande`, `6 → Muy Grande`, `7 → Adulto`.
- La especie se guarda en `Tree.kind`; los árboles viejos sin especie se leen como pino.

## Generación

Los atlas se generan con `pixelperfect/pixelperfect_atlas.py` (fuera del repo, en la raíz del workspace) a partir de la imagen de IA en alta resolución. No se reescalan ni se retocan con interpolación suave. La guía completa está en `pixelperfect/README.md`.

1. Generar `atlas.png`, los sprites individuales y `preview_x6.png` (una fila, sprites separados, ~5–7 px de arte por píxel final).
2. Crear el `.json` con `x`, `y`, `w`, `h` y `anchor` de cada frame; el script no lo escribe. El frame abarca todo el contenido del sprite (incluida la sombra, con alfa > 0) y el `anchor` marca la base del tronco y el centro horizontal del sprite: `anchor = [centro horizontal de la sombra/copa, fila base − y]`. En los árboles grandes ese centro no coincide con el del tronco (la copa y la sombra se corren), y usar el centro del marco es lo que deja el árbol centrado en su celda.
3. Copiar a `public/sprites/` con los nombres de arriba. El pino necesita sus 8 frames; el abedul se agrega con 10. Si falta una especie, el resto sigue funcionando.

Los PNG de `<salida>/sprites/` son para revisar; la app usa el atlas. `preview_x6.png` es solo para inspección (fondo blanco, NEAREST 6×).

## Dimensiones y anclaje

- El atlas del pino mide `122×92` y se dibuja a tamaño nativo. El adulto mide `44×89`; el brote `13×13`.
- El atlas vivo del abedul (`abedul_vivo_atlas.png`) mide `187×130` y se dibuja a tamaño nativo. El adulto mide `64×121`; el brote `11×14`. Todos los frames incluyen la sombra semitransparente; el marco llega un par de filas más abajo que el arte y el anclaje marca la base del tronco (fila 119 del atlas).
- El atlas marchito del abedul (`abedul_muerto_downscale_atlas.png`) mide también `187×130` y se dibuja a tamaño nativo. El adulto mide `61×120`; el brote `10×14`. Misma convención de marco y anclaje (base en la fila 118–120 según la etapa).
- El atlas del roble mide `314×142` y se dibuja a tamaño nativo. El adulto mide `66×137`; el brote `10×10`. El marchito (`roble_muerto_atlas.png`) mide `278×144`, con el adulto en `64×133`.
- El anclaje se lee de cada frame y marca la base del tronco; en horizontal apunta al centro de la sombra, que es lo que deja el sprite centrado en la celda. Todos los frames de estos atlas incluyen la sombra pixelada semitransparente.
- La escena lógica usa celda `60×30` y escala base entera (1×, 2×…) según el contenedor; el zoom también se mantiene en escalas enteras.

## Activación

- `SPRITES_ENABLED = true` en `src/render/sprites.ts`.
- `loadAtlas` exige los frames del pino. Los atlas de otras especies se cargan si están disponibles; si falta un frame concreto, ese árbol usa el placeholder dibujado por código.
