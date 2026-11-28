/**
 * W1-P1.4 Task 2 — Public Attribute and State-Marker Characterization
 * (ATTR-012 / ATTR-013 / ATTR-022).
 *
 * Public-surface-only characterization of attributes the element writes onto
 * its host or its OWN shadow-root elements in response to public config /
 * public DOM assignment:
 *   ATTR-012  host `data-custom-arrow` on custom arrow-slot assignment /
 *             unassignment / replacement;
 *   ATTR-013  forced host `style.display = 'block'` on connection, including
 *             re-connection (characterizing the Angular-workaround behavior
 *             that DEVIATION-05 documents — characterized, not endorsed);
 *   ATTR-022  `data-multi-scroll-mode` / `data-drag-scroll` on the input
 *             container (`part="button"`) across multi/single and scroll
 *             configs.
 *
 * ATTR-021 (data-motion="closing") and ATTR-023 (data-virtual-spacer) are NOT
 * characterized here: ATTR-021 requires a real browser (computed animation
 * duration; jsdom resolves no animation-name → duration 0) and is covered by
 * the Chromium spec; ATTR-023 is only reachable through a private test seam
 * and remains a documented gap (see the T2 ATTR evidence).
 *
 * Driving surface (NO private methods, NO private fields):
 *   - public methods: setItems / updateConfig;
 *   - public config via updateConfig({...});
 *   - public light-DOM slot assignment (child element with slot="arrow").
 *
 * Observation surface (NO private state):
 *   - host getAttribute('data-custom-arrow') and host style.display;
 *   - shadowRoot.querySelector('[part="button"]') attribute reads.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import { SelectOption } from '../src/components/select-option';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
if (!customElements.get('select-option')) {
  customElements.define('select-option', SelectOption);
}

type Item = { id: string; value: string; label: string; disabled?: boolean };

const FOUR: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo', disabled: true },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
];

let el: EnhancedSelect | undefined;

function mount(config: Record<string, unknown> = {}): EnhancedSelect {
  const node = document.createElement('enhanced-select') as EnhancedSelect;
  if (Object.keys(config).length) node.updateConfig(config as never);
  node.setItems(FOUR);
  document.body.appendChild(node);
  el = node;
  return node;
}

/** Let slotchange / rAF-driven sync settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  el?.remove();
  el = undefined;
  document.body.innerHTML = '';
});

function inputContainer(node: EnhancedSelect): HTMLElement {
  const part = node.shadowRoot!.querySelector<HTMLElement>('[part="button"]');
  expect(part, 'part="button" present').toBeTruthy();
  return part!;
}

// ===========================================================================
// ATTR-012 — host data-custom-arrow reflects custom arrow-slot assignment
// ===========================================================================

describe('W1-P1.4 T2 — ATTR-012 (host data-custom-arrow on arrow-slot assignment)', () => {
  it('ATTR-012: assigning a custom arrow element sets data-custom-arrow="true" on the host', async () => {
    const node = mount();
    await flush();
    // Negative precondition: no marker while the built-in default arrow is used.
    expect(node.hasAttribute('data-custom-arrow')).toBe(false);
    expect(node.getAttribute('data-custom-arrow')).toBeNull();

    const custom = document.createElement('span');
    custom.slot = 'arrow';
    custom.textContent = 'CUSTOM';
    node.appendChild(custom);
    await flush();

    expect(node.getAttribute('data-custom-arrow')).toBe('true');
    // Ownership: marker lives on the host, not on any shadow-root element.
    expect(node.shadowRoot!.querySelector('[data-custom-arrow]')).toBeNull();
  });

  it('ATTR-012: removing the custom arrow drops the marker; replacing it keeps it (still assigned)', async () => {
    const node = mount();
    await flush();
    const first = document.createElement('span');
    first.slot = 'arrow';
    first.textContent = 'ONE';
    node.appendChild(first);
    await flush();
    expect(node.getAttribute('data-custom-arrow')).toBe('true');

    // Replacement is a re-assignment: still exactly one assigned arrow.
    const second = document.createElement('span');
    second.slot = 'arrow';
    second.textContent = 'TWO';
    first.replaceWith(second);
    await flush();
    expect(node.getAttribute('data-custom-arrow')).toBe('true');
    const slot = node.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="arrow"]');
    expect(slot!.assignedElements()).toHaveLength(1);
    expect(slot!.assignedElements()[0]).toBe(second);

    // Removal leaves no assigned arrow and no marker.
    second.remove();
    await flush();
    expect(node.hasAttribute('data-custom-arrow')).toBe(false);
    expect(node.getAttribute('data-custom-arrow')).toBeNull();
  });
});

// ===========================================================================
// ATTR-013 — forced host style.display = 'block' on connection / re-connection
// ===========================================================================

describe('W1-P1.4 T2 — ATTR-013 (forced host display:block on connection)', () => {
  it('ATTR-013: connecting forces inline style.display="block" on the host', () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    el = node;
    expect(node.style.display).toBe('');
    document.body.appendChild(node);
    expect(node.style.display).toBe('block');
  });

  it('ATTR-013: re-connecting re-asserts display="block" (overrides a caller-set inline display)', async () => {
    const node = mount();
    expect(node.style.display).toBe('block');

    node.remove();
    // Simulate a caller/host writing its own inline display between lives.
    node.style.display = 'inline-block';
    document.body.appendChild(node);
    await flush();

    expect(node.style.display).toBe('block');
    // Reconnect of a genuinely connected host is honored (still in the document).
    expect(node.isConnected).toBe(true);
  });
});

// ===========================================================================
// ATTR-022 — data-multi-scroll-mode / data-drag-scroll on the input container
// ===========================================================================

describe('W1-P1.4 T2 — ATTR-022 (data-multi-scroll-mode / data-drag-scroll)', () => {
  it('ATTR-022: a single-select host carries neither multi-scroll attribute', () => {
    const node = mount({ selection: { mode: 'single' } });
    const part = inputContainer(node);
    expect(part.hasAttribute('data-multi-scroll-mode')).toBe(false);
    expect(part.hasAttribute('data-drag-scroll')).toBe(false);
  });

  it('ATTR-022: multi-select defaults to data-multi-scroll-mode="wrap" and data-drag-scroll="false"', () => {
    const node = mount({ selection: { mode: 'multi' } });
    const part = inputContainer(node);
    expect(part.getAttribute('data-multi-scroll-mode')).toBe('wrap');
    // drag scroll is only effective for the horizontal mode.
    expect(part.getAttribute('data-drag-scroll')).toBe('false');
  });

  it('ATTR-022: horizontal mode sets data-multi-scroll-mode="horizontal" and data-drag-scroll="true"', () => {
    const node = mount({ selection: { mode: 'multi' }, multiSelectDisplay: { mode: 'horizontal' } });
    const part = inputContainer(node);
    expect(part.getAttribute('data-multi-scroll-mode')).toBe('horizontal');
    expect(part.getAttribute('data-drag-scroll')).toBe('true');
  });

  it('ATTR-022: horizontal mode with dragScroll=false keeps mode but disables data-drag-scroll', () => {
    const node = mount({
      selection: { mode: 'multi' },
      multiSelectDisplay: { mode: 'horizontal', dragScroll: false },
    });
    const part = inputContainer(node);
    expect(part.getAttribute('data-multi-scroll-mode')).toBe('horizontal');
    expect(part.getAttribute('data-drag-scroll')).toBe('false');
  });

  it('ATTR-022: switching multi→single removes both multi-scroll attributes', () => {
    const node = mount({ selection: { mode: 'multi' }, multiSelectDisplay: { mode: 'horizontal' } });
    const part = inputContainer(node);
    expect(part.getAttribute('data-multi-scroll-mode')).toBe('horizontal');
    expect(part.getAttribute('data-drag-scroll')).toBe('true');

    node.updateConfig({ selection: { mode: 'single' } } as never);
    expect(part.hasAttribute('data-multi-scroll-mode')).toBe(false);
    expect(part.hasAttribute('data-drag-scroll')).toBe(false);
  });
});
