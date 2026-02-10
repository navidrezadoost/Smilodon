# Performance Runbook – Manual Browser Measurements

Use this runbook to **manually but repeatably** measure real-world performance in the browser.

---

## Prerequisites

- Chrome (preferably Canary or Dev for extra tooling)
- DevTools open (Performance + Memory tabs)
- Playground or demo page open
- FPS meter enabled (DevTools Rendering → FPS meter, or `window.smilodonEnableFPSMeter?.()` in dev builds)

---

## Measurement Checklist (per scenario)

- [ ] Time to interactive / first paint after dropdown opens
- [ ] Average FPS during 10 seconds of fast scrolling
- [ ] Minimum FPS during scrolling
- [ ] Time to render after typing 8–10 characters in search (debounced)
- [ ] Heap size before testing
- [ ] Heap size after 2 minutes of scrolling + selecting + searching
- [ ] Major GCs during testing

---

## Scenarios to Test (priority order)

1. **10,000 items** — baseline
2. **100,000 items** — realistic heavy
3. **500,000 items** — stress
4. **1,000,000 items** — extreme claim

### Variants (apply to any size)

- **A.** Simple (single select, no search, no custom render)
- **B.** Multi-select + group select 500–1000 items
- **C.** Live search (fast typing + debounce)
- **D.** Heavy custom render (template with image + multiple spans + badge)

---

## Tools & Recording

- **Performance tab** → record from open through 10 seconds of scroll
- **Memory tab** → heap snapshot before and after
- **Console** → `performance.mark()` / `performance.measure()` output
- **FPS** → DevTools FPS meter or `window.smilodonEnableFPSMeter?.()`

---

## Suggested First Deep Test

- **Data size:** 1,000,000 items
- **Mode:** multi-select enabled
- **Search:** live search with debounce (~300ms)
- **Render:** heavy custom render (thumbnail + 3–4 spans + badge)

**Operations**
1. Open dropdown
2. Scroll quickly to middle, then end
3. Type 8–10 characters and wait for filtered render
4. Select 500–1000 items with shift
5. Close and reopen
