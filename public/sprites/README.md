# Sprites

Acá van los assets finales. Mientras no existan, `drawGarden` dibuja árboles placeholder por código y no pide ningún archivo, así que no hay errores 404.

## Atlas

- `atlas.png`: una sola imagen con todos los frames.
- `atlas.json`: la posición de cada frame.

```json
{
  "frames": {
    "tree.pine.1": { "x": 0, "y": 0, "w": 64, "h": 128 },
    "tree.pine.2": { "x": 64, "y": 0, "w": 64, "h": 128 },
    "tree.pine.3": { "x": 128, "y": 0, "w": 64, "h": 128 },
    "tree.pine.4": { "x": 192, "y": 0, "w": 64, "h": 128 },
    "tree.withered": { "x": 256, "y": 0, "w": 64, "h": 128 }
  }
}
```

- Todos los frames comparten un lienzo de 64×128 y se anclan abajo al centro.
- `loadAtlas` en `src/render/sprites.ts` usa este formato. Cuando `atlas.png` y `atlas.json` estén listos, cambiar `SPRITES_ENABLED` a `true` en ese mismo archivo. Mientras esté en `false`, el render usa los placeholders y no pide ningún archivo.
- No usar hojas de terceros sin una licencia compatible. Registrar todo en `LICENSES.md`.
