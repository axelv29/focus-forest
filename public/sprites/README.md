# Sprites

Acá van los assets finales. Mientras no existan, `drawGarden` dibuja árboles placeholder por código y no pide ningún archivo, así que no hay errores 404.

## Atlas

- `atlas.png`: una sola imagen con los 8 frames.
- `atlas.json`: la posición de cada frame.

Cada etapa tiene un frame vivo y uno marchito. Los nombres que usa el render son:

| Etapa | Vivo | Marchito |
| --- | --- | --- |
| Brote | `tree.brote` | `tree.brote.withered` |
| Joven | `tree.joven` | `tree.joven.withered` |
| Maduro | `tree.maduro` | `tree.maduro.withered` |
| Adulto | `tree.adulto` | `tree.adulto.withered` |

```json
{
  "frames": {
    "tree.brote": { "x": 0, "y": 0, "w": 64, "h": 128 },
    "tree.joven": { "x": 64, "y": 0, "w": 64, "h": 128 },
    "tree.maduro": { "x": 128, "y": 0, "w": 64, "h": 128 },
    "tree.adulto": { "x": 192, "y": 0, "w": 64, "h": 128 },
    "tree.brote.withered": { "x": 256, "y": 0, "w": 64, "h": 128 },
    "tree.joven.withered": { "x": 320, "y": 0, "w": 64, "h": 128 },
    "tree.maduro.withered": { "x": 384, "y": 0, "w": 64, "h": 128 },
    "tree.adulto.withered": { "x": 448, "y": 0, "w": 64, "h": 128 }
  }
}
```

- Todos los frames comparten un lienzo de 64×128 y se anclan abajo al centro.
- Al abandonar, se usa el frame marchito de la etapa alcanzada: un brote abandonado usa `tree.brote.withered`; un árbol adulto abandonado usa `tree.adulto.withered`.
- Los archivos sueltos sirven como fuente editable; la página solo carga `atlas.png` + `atlas.json`.
- `loadAtlas` en `src/render/sprites.ts` usa este formato. Cuando los dos archivos estén en esta carpeta, cambiar `SPRITES_ENABLED` a `true` en ese mismo archivo. Mientras esté en `false`, el render usa los placeholders y no pide ningún archivo.
- Si tu atlas usa otros nombres, podés renombrar las claves del JSON o ajustar `TREE_STAGE_FRAME_NAMES` en `src/render/sprites.ts`.
- No usar hojas de terceros sin una licencia compatible. Registrar todo en `LICENSES.md`.
