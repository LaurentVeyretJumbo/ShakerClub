# ShakerClub — Agent Instructions

Vanilla JS single-page mobile game. No build step, no framework, no linter.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` → `http://localhost:5173` |
| Verify (static checks) | `npm run build` |

See [README.md](README.md) for mobile/HTTPS testing instructions.

## Architecture

**Single file, single state object.** All logic lives in `src/main.js`. There are no components, no modules, no virtual DOM.

- `state` — one plain object, mutated directly by functions
- `render()` — replaces entire `app.innerHTML` on every state change
- `update(timestamp)` — `requestAnimationFrame` loop; runs physics, triggers lottery at `progress >= 100`
- Two screens: `'home'` and `'game'` (set via `state.screen`)

> Do **not** introduce reactive state, component abstraction, or module splitting unless explicitly asked.

## Rendering Pattern

```js
// Right: mutate state then call render()
state.foo = bar;
render();

// Wrong: manipulating DOM directly
document.querySelector('.foo').textContent = bar;
```

All re-renders are total replacements of `app.innerHTML`. Prefer updating `state.*` + calling `render()`.

## Lottery System

The lottery triggers when `state.progress >= 100`. Phases stored in `state.lottery.phase`:

| Phase | What happens |
|-------|-------------|
| `'rolling'` | Countdown 3-2-1 shown for 3300 ms, then `doLotteryRoll()` |
| `'result'` | Success shown for 1500 ms, then transitions to `'shake'` |
| `'shake'` | Progress reset to 0, user shakes again for next attempt |
| `'fail'` | Terminal — game over |
| `'won'` | Terminal — all 5 attempts passed |

Fail probability: `Math.floor(Math.random() * (7 - attempt)) === 0`  
(attempt 1 → 1/6 chance, 5 → 1/2 chance)

## Key Physics Constants (`src/main.js` top)

| Constant | Value | Role |
|----------|-------|------|
| `SHAKE_THRESHOLD` | 2.15 | Minimum force to register shake |
| `PROGRESS_GAIN` | 18 | Progress units/sec while shaking |
| `DECAY_PER_SECOND` | 9 | Progress loss/sec when idle |
| `SMOOTHING` | 0.22 | EMA alpha for sensor smoothing |
| `SENSOR_TIMEOUT_MS` | 1800 | ms before stale sensor force → 0 |
| `MAX_SAVES` | 5 | Number of lottery attempts |

## CSS Conventions

- **BEM naming**: `.block`, `.block__element`, `.block--modifier`
- **Neon glow**: cyan `#00f7ff` and pink `#ff00aa` / `#ff26da` via `text-shadow` and `box-shadow` layers
- **Animations**: defined as `@keyframes` at file end; applied with `animation:` shorthand
- **Dynamic transform**: `--shake-y` and `--shake-tilt` CSS variables set inline on `.shaker`
- No CSS pre-processor; plain CSS only

## Sensor & Permissions

- Desktop: keyboard (Space/↑/W), mouse click, vertical drag → `addFallbackShake()`
- Mobile Android: `DeviceMotionEvent` works over HTTP
- **iOS Safari**: requires HTTPS **and** explicit `DeviceMotionEvent.requestPermission()` call triggered by user gesture — already implemented in `ensureMotionAccess()`

## Conventions

- All user-facing text is **French** — keep it French when adding messages
- Status messages go through `state.status` → displayed in `.status` element
- `clamp(value, min, max)` helper is available globally in the file
- No TypeScript, no JSDoc required
