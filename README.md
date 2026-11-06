# Focus Forest

App web de enfoque con pomodoro de 25 minutos y descanso de 5. Cada sesión completada planta un pino en una pradera isométrica de 8×8; abandonar deja el árbol marchito. El progreso se guarda en el navegador.

## Estado

v0.1 funcional: timer de enfoque y descanso, crecimiento en 4 etapas, pradera 8×8, estadísticas, guardado local, zoom y arrastre acotado de la pradera. Los árboles y el suelo ya usan los sprites definitivos. El deploy a Vercel queda pendiente de la cuenta. El alcance y los criterios están en [`FICHA_v0.1.md`](./FICHA_v0.1.md); las decisiones y la guía de estilo, en [`docs/PLAN.md`](./docs/PLAN.md).

Repositorio: [github.com/axelv29/focus-forest](https://github.com/axelv29/focus-forest).

## Documentación

| Archivo | Para qué sirve |
| --- | --- |
| [`docs/PLAN.md`](./docs/PLAN.md) | Plan de producto, decisiones y guía de estilo. |
| [`docs/THEMING.md`](./docs/THEMING.md) | Sistema de tema: paleta, tipografías, tarjetas y botones. |
| [`FICHA_v0.1.md`](./FICHA_v0.1.md) | Alcance, modelo de datos y criterios de aceptación. |
| [`CONTEXTO.md`](./CONTEXTO.md) | Reglas para trabajar en el repositorio. |
| [`public/sprites/README.md`](./public/sprites/README.md) | Formato del atlas y cómo activarlo. |

## Requisitos

- Node.js LTS (probado con Node 24).
- npm.

En Windows, si PowerShell bloquea `npm.ps1`, usar `npm.cmd`.

## Empezar

```bash
npm install
npm run dev
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos + build de producción |
| `npm run preview` | Sirve el build |
| `npm run lint` | oxlint |
| `npm test` | Vitest |
| `npm run test:watch` | Vitest en modo watch |
| `npm run format` | Prettier |

## Stack

- Vite 8 + React 19 + TypeScript 7 (strict)
- Tailwind CSS v4 (CSS-first)
- Zustand + `persist`
- Canvas 2D
- Vitest
- oxlint + Prettier

## Estructura

```
docs/          plan y guía de tema
public/        sprites y assets estáticos
src/
  config/      grilla, duraciones, umbrales y zoom
  state/       tipos, store, persistencia, selectores
  logic/       timer, growth, stats, placement, day, zoom, pan
  render/      isometría, atlas, dibujo
  styles/      tokens del tema visual
  hooks/       useCountdown
  components/  interfaz
  tests/       pruebas de la lógica
```

## Reglas del proyecto

Ver [`CONTEXTO.md`](./CONTEXTO.md). Antes de cada commit: `npm run lint`, `npm test` y `npm run build`.

## Deploy

Listo para Vercel: framework Vite, build `npm run build`, salida `dist` (`vercel.json`). El workflow de CI está en `.github/workflows/ci.yml`.

### Desde la web

1. Subí los cambios a GitHub:

   ```bash
   git add .
   git commit -m "feat: rediseño del HUD y robustez de persistencia"
   git push origin main
   ```

2. Entrá a [vercel.com/new](https://vercel.com/new) e importá `axelv29/focus-forest`.
3. Dejá el **Root Directory** vacío: el proyecto está en la raíz del repositorio.
4. Verificá el preset **Vite**. Build Command: `npm run build`. Output Directory: `dist`.
5. No hacen falta variables de entorno.
6. Presioná **Deploy**. Cada push a `main` vuelve a desplegar.

### Con la CLI

```bash
npx vercel login
npx vercel
npx vercel --prod
```

`npx vercel` crea el proyecto y hace un deploy de preview; `--prod` publica en producción. La carpeta `.vercel` ya está ignorada por git.

### Verificación

- Abrí la URL de producción y comprobá que carga el favicon, el timer y la pradera.
- Revisá la consola del navegador: no debe haber errores.
- En Vercel, **Deployments** muestra el historial; **Settings → Domains** permite agregar un dominio propio.

## Licencias

Ver [`LICENSES.md`](./LICENSES.md).
