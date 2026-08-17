# SWARM (working title)

Incremental horde tower defense: thousands of enemies flow across an open field
like a fluid; you hold the line with turrets, lose, bank cores anyway, buy
permanent upgrades, and push further. Abstract-shapes aesthetic (placeholder
theme — mechanics first).

## Run

```
npm install
npm run dev      # dev server
npm run build    # type-check + production build (dist/)
```

Debug/verification: append `?demo=N` to jump into wave N with a prebuilt gun
line; `window.__swarm` exposes `{ game, save }` to automation. Playwright
verification scripts live in `scripts/` (run with a Python that has Playwright).

## Controls

- `1/2/3` or bottom-bar buttons: select tower (click again to deselect), click field to place
- `Q`: arm orbital strike, click field to fire
- `Space`: start wave · right-click/Esc: cancel · speed button: 1×/2×/4×

## Architecture

- `src/defs.ts` — all tuning data (enemies, towers, constants)
- `src/sim/` — flow field (Dijkstra + smoothing), SoA enemy pool, spatial hash,
  towers (block + breachable), surge spawner, run orchestration
- `src/meta/` — permanent upgrades + versioned localStorage save
- `src/ui/`, `src/render/` — DOM HUD, canvas renderer (batched rects)
- Fixed 60 Hz sim, decoupled render, 20k enemy capacity at 60 fps
