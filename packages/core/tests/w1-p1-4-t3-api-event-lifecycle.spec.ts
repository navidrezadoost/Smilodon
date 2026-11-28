/**
 * W1-P1.4 Task 3 — Public API, Event, Lifecycle, and Configuration-Wiring
 * Characterization (API-002 / EVENT-011 / LIFECYCLE-002 / LIFECYCLE-003 /
 * LIFECYCLE-004 / CONFIG-023).
 *
 * Public-surface-only characterization:
 *   API-002        public `groupHeaderRenderer` getter/setter, identity-
 *                  preserving assignment, replacement, and rendered effects;
 *   EVENT-011      public `emptyStateChange` event: exact frozen payload,
 *                  real state transitions, and duplicate-event boundaries;
 *   LIFECYCLE-002  public behavior after connect (document-listener effect +
 *                  onOpen callback on connect);
 *   LIFECYCLE-003  public behavior after disconnect (popup closes, rendered
 *                  options released, element detached and inert to outside
 *                  input) — the OBSERVED effects only; this does not prove
 *                  listener removal or resource cardinality internally;
 *   LIFECYCLE-004  reconnect invariant (rendering restored without
 *                  duplication; outside-input close still works across cycles)
 *                  — an OBSERVABLE invariant, not proof of exactly one
 *                  internal document listener;
 *   CONFIG-023     public `expandable` config — established UNWIRED (no public
 *                  effect); kept Missing with an explicit gap.
 *
 * Driving surface (NO private methods, NO private fields):
 *   - public methods: setItems / setGroupedItems / updateConfig / open /
 *     getEmptyStateContext;
 *   - public search input (part="input") value + dispatched `input` event;
 *   - public DOM gestures (document pointerdown via a composed MouseEvent);
 *   - connect/disconnect via appendChild / remove.
 *
 * Observation surface (NO private state):
 *   - shadowRoot parts (group-header, option, no-results), host attributes
 *     (data-open), the `emptyStateChange` CustomEvent payload, and public
 *     lifecycle callbacks (callbacks.onOpen) as externally observable effects.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import { SelectOption } from '../src/components/select-option';
import { resetSelectConfig } from '../src/config/global-config';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
if (!customElements.get('select-option')) {
  customElements.define('select-option', SelectOption);
}

type Item = { id: string; value: string; label: string };

const TWO: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo' },
];

let el: EnhancedSelect | undefined;

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mount(config: Record<string, unknown> = {}): EnhancedSelect {
  const node = document.createElement('enhanced-select') as EnhancedSelect;
  if (Object.keys(config).length) node.updateConfig(config as never);
  node.setItems(TWO);
  document.body.appendChild(node);
  el = node;
  return node;
}

function shadow(node: EnhancedSelect, sel: string): HTMLElement | null {
  return node.shadowRoot!.querySelector<HTMLElement>(sel);
}

function typeSearch(node: EnhancedSelect, value: string): void {
  const input = node.shadowRoot!.querySelector<HTMLInputElement>('input[part="input"]')!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function onOpenCount(node: EnhancedSelect): { count: () => number } {
  const counter = { n: 0 };
  node.updateConfig({ callbacks: { onOpen: () => { counter.n += 1; } } } as never);
  return { count: () => counter.n };
}

const outsidePointerDown = (): void => {
  document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true, button: 0 }));
};

function closeEventCounter(node: EnhancedSelect): { count: () => number } {
  const counter = { n: 0 };
  node.addEventListener('close', () => { counter.n += 1; });
  return { count: () => counter.n };
}

afterEach(() => {
  el?.remove();
  el = undefined;
  document.body.replaceChildren();
  resetSelectConfig();
});

// ===========================================================================
// API-002 — public groupHeaderRenderer getter/setter
// ===========================================================================

describe('W1-P1.4 T3 — API-002 (groupHeaderRenderer getter/setter + rendered effect)', () => {
  it('API-002: default is undefined; setting a renderer is returned by the getter and drives group headers', async () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    node.setGroupedItems([{ label: 'Fruit', options: [{ value: 'apple', label: 'Apple' }] }]);
    document.body.appendChild(node);
    el = node;
    await flush();

    expect(node.groupHeaderRenderer).toBeUndefined();

    const renderer = (group: { label: string }) => {
      const header = document.createElement('div');
      header.textContent = `H:${group.label}`;
      header.dataset.custom = '1';
      return header;
    };
    node.groupHeaderRenderer = renderer as never;
    await flush();

    // Getter returns the assigned reference.
    expect(node.groupHeaderRenderer).toBe(renderer);
    // Rendered effect: the renderer's element becomes the group-header part.
    const header = shadow(node, '[part="group-header"]')!;
    expect(header.textContent).toBe('H:Fruit');
    expect(header.dataset.custom).toBe('1');
    expect(header.getAttribute('role')).toBe('presentation');
    expect(header.classList.contains('group-header')).toBe(true);
  });

  it('API-002: identity-preserving assignment keeps the same instance (public stability, not an internal-return proof)', async () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    node.setGroupedItems([{ label: 'G', options: [{ value: 'x', label: 'X' }] }]);
    document.body.appendChild(node);
    el = node;
    await flush();

    const renderer = (group: { label: string }) => {
      const d = document.createElement('div');
      d.textContent = group.label;
      return d;
    };
    node.groupHeaderRenderer = renderer as never;
    await flush();
    const firstHeader = shadow(node, '[part="group-header"]');

    // Re-assign the SAME reference: the public instance is stable.
    node.groupHeaderRenderer = renderer as never;
    await flush();

    expect(node.groupHeaderRenderer).toBe(renderer);
    // Stability is externally observable (same function identity); this does
    // NOT by itself prove the internal early-return branch.
    expect(shadow(node, '[part="group-header"]')).toBe(firstHeader);
  });

  it('API-002: replacement re-renders headers from the new renderer; clearing restores the default label', async () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    node.setGroupedItems([{ label: 'G1', options: [{ value: 'x', label: 'X' }] }]);
    document.body.appendChild(node);
    el = node;
    await flush();

    node.groupHeaderRenderer = ((g: { label: string }) => {
      const d = document.createElement('div');
      d.textContent = `A:${g.label}`;
      return d;
    }) as never;
    await flush();
    expect(shadow(node, '[part="group-header"]')!.textContent).toBe('A:G1');

    // Replacement: new renderer drives the next render.
    const replacement = (g: { label: string }) => {
      const d = document.createElement('div');
      d.textContent = `B:${g.label}`;
      return d;
    };
    node.groupHeaderRenderer = replacement as never;
    await flush();
    expect(node.groupHeaderRenderer).toBe(replacement);
    expect(shadow(node, '[part="group-header"]')!.textContent).toBe('B:G1');

    // Clearing restores the default (plain label) header.
    node.groupHeaderRenderer = undefined;
    await flush();
    expect(node.groupHeaderRenderer).toBeUndefined();
    expect(shadow(node, '[part="group-header"]')!.textContent).toBe('G1');
  });
});

// ===========================================================================
// EVENT-011 — public emptyStateChange event
// ===========================================================================

describe('W1-P1.4 T3 — EVENT-011 (emptyStateChange payload, transitions, duplicates)', () => {
  it('EVENT-011: searching to no results emits {context:{query,reason:no-results}} and exposes it via getEmptyStateContext', async () => {
    const node = mount({ searchable: true });
    const events: Array<{ context: unknown }> = [];
    node.addEventListener('emptyStateChange', (e) => events.push((e as CustomEvent<{ context: unknown }>).detail));

    typeSearch(node, 'zzz');
    await flush();

    expect(events).toEqual([{ context: { query: 'zzz', reason: 'no-results' } }]);
    expect(node.getEmptyStateContext()).toEqual({ query: 'zzz', reason: 'no-results' });
    // Payload shape preserved exactly: context has only query + reason.
    const ctx = node.getEmptyStateContext()!;
    expect(Object.keys(ctx).sort()).toEqual(['query', 'reason']);
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  it('EVENT-011: a repeated identical query emits NO duplicate (no state change)', async () => {
    const node = mount({ searchable: true });
    const events: unknown[] = [];
    node.addEventListener('emptyStateChange', (e) => events.push((e as CustomEvent).detail));

    typeSearch(node, 'zzz');
    await flush();
    expect(events).toHaveLength(1);

    // Same effective context again -> no new notification.
    typeSearch(node, 'zzz');
    await flush();
    expect(events).toHaveLength(1);
  });

  it('EVENT-011: clearing the query transitions context back to null (real state change)', async () => {
    const node = mount({ searchable: true });
    const events: Array<{ context: unknown }> = [];
    node.addEventListener('emptyStateChange', (e) => events.push((e as CustomEvent<{ context: unknown }>).detail));

    typeSearch(node, 'zzz');
    await flush();
    expect(events.at(-1)).toEqual({ context: { query: 'zzz', reason: 'no-results' } });

    typeSearch(node, '');
    await flush();
    expect(events.at(-1)).toEqual({ context: null });
    expect(node.getEmptyStateContext()).toBeNull();
  });

  it('EVENT-011: empty item set reports no-options; populated set clears the context (negative)', async () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    const events: Array<{ context: unknown }> = [];
    node.addEventListener('emptyStateChange', (e) => events.push((e as CustomEvent<{ context: unknown }>).detail));
    node.setItems([]);
    document.body.appendChild(node);
    el = node;
    await flush();

    expect(node.getEmptyStateContext()).toEqual({ query: '', reason: 'no-options' });
    expect(events.at(-1)).toEqual({ context: { query: '', reason: 'no-options' } });

    node.setItems(TWO);
    await flush();
    expect(node.getEmptyStateContext()).toBeNull();
    expect(events.at(-1)).toEqual({ context: null });
  });
});

// ===========================================================================
// LIFECYCLE-002 / -003 / -004 — attach / release / reconnect, observably
// ===========================================================================

describe('W1-P1.4 T3 — LIFECYCLE-002/-003/-004 (attach / release / reconnect)', () => {
  it('LIFECYCLE-002: after connect an outside pointerdown closes an open popup (document-listener effect)', async () => {
    const node = mount();
    node.open();
    await flush();
    expect(node.getAttribute('data-open')).toBe('true');

    outsidePointerDown();
    await flush();
    expect(node.getAttribute('data-open')).toBeNull();
  });

  it('LIFECYCLE-002: connecting fires the public onOpen lifecycle callback once', async () => {
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    const cb = onOpenCount(node);
    node.setItems(TWO);
    document.body.appendChild(node);
    el = node;
    await flush();
    // Exactly one connect -> exactly one onOpen callback invocation.
    expect(cb.count()).toBe(1);
  });

  it('LIFECYCLE-003: disconnecting closes an open popup and releases rendered options from the shadow tree', async () => {
    const node = mount();
    node.open();
    await flush();
    expect(node.getAttribute('data-open')).toBe('true');
    expect(node.shadowRoot!.querySelectorAll('[part="option"]').length).toBe(TWO.length);

    node.remove();
    el = undefined;
    await flush();

    // Release: popup closed and no rendered option nodes retained.
    expect(node.getAttribute('data-open')).toBeNull();
    expect(node.shadowRoot!.querySelectorAll('[part="option"]').length).toBe(0);
  });

  it('LIFECYCLE-003: after disconnect the detached element remains closed and detached on outside input', async () => {
    const node = mount();
    node.open();
    await flush();
    expect(node.getAttribute('data-open')).toBe('true');

    node.remove();
    el = undefined;
    await flush();

    // Disconnect already closed the popup; record that pre-condition so the
    // post-input assertion is meaningful (it is not vacuous only because the
    // element was never open).
    expect(node.getAttribute('data-open')).toBeNull();

    // Outside input after disconnect does not re-open the detached element and
    // produces no unexpected state change. NOTE: this asserts OBSERVED behavior
    // of the detached element; it does NOT (and cannot, black-box) prove that a
    // document listener was removed — see evidence T3-F01.
    outsidePointerDown();
    await flush();
    expect(node.getAttribute('data-open')).toBeNull();
    expect(node.isConnected).toBe(false);
  });

  it('LIFECYCLE-004: reconnecting re-renders each item exactly once (no duplicated render effects)', async () => {
    const node = mount();
    expect(node.shadowRoot!.querySelectorAll('[part="option"]').length).toBe(TWO.length);

    node.remove();
    document.body.appendChild(node);
    await flush();

    // Reconnect: option count equals item count — not doubled.
    expect(node.shadowRoot!.querySelectorAll('[part="option"]').length).toBe(TWO.length);
    // Each rendered option is a distinct node.
    const labels = Array.from(node.shadowRoot!.querySelectorAll('[part="option"]'))
      .map((o) => o.getAttribute('data-value'));
    expect(labels).toEqual(['a', 'b']);
  });

  it('LIFECYCLE-004: after reconnect outside input still closes the popup, once per open (observable invariant)', async () => {
    const node = mount();
    node.remove();
    document.body.appendChild(node);
    await flush();
    el = node;

    const closes = closeEventCounter(node);

    node.open();
    await flush();
    expect(node.getAttribute('data-open')).toBe('true');

    // A single outside pointerdown closes the popup and emits exactly one
    // public `close` event for this open. NOTE: this is an OBSERVABLE close
    // count, not proof that exactly one internal document listener exists —
    // duplicate listeners encountering an already-closed popup would observe
    // the same single close (see evidence T3-F02).
    outsidePointerDown();
    await flush();
    expect(node.getAttribute('data-open')).toBeNull();
    expect(closes.count()).toBe(1);

    // A second open/close cycle still yields exactly one close per open.
    node.open();
    await flush();
    expect(node.getAttribute('data-open')).toBe('true');
    outsidePointerDown();
    await flush();
    expect(node.getAttribute('data-open')).toBeNull();
    expect(closes.count()).toBe(2);
  });
});

// ===========================================================================
// CONFIG-023 — public `expandable` config is UNWIRED (no public effect)
// ===========================================================================

describe('W1-P1.4 T3 — CONFIG-023 (expandable config has no public effect — gap)', () => {
  it('CONFIG-023: expandable.enabled=true renders no expand/collapse UI and exposes no public expand control', async () => {
    const node = mount({ expandable: { enabled: true } });
    node.open();
    await flush();

    // No expand/collapse control and no expand-related part tokens render.
    const partNames = Array.from(node.shadowRoot!.querySelectorAll('[part]'))
      .map((e) => e.getAttribute('part') ?? '');
    expect(partNames.some((p) => p.includes('expand'))).toBe(false);
    expect(node.shadowRoot!.querySelector('[data-expand], [class*="expand"]')).toBeNull();

    // The config value is accepted (no throw) but drives nothing observable:
    // the capabilities report advertises no expand feature, corroborating the
    // unwired path (see evidence gap for CONFIG-023).
    const caps = node.getCapabilities();
    expect(JSON.stringify(caps).toLowerCase().includes('expand')).toBe(false);
  });

  it('CONFIG-023: toggling expandable.enabled at runtime produces no observable DOM change (unwired negative)', async () => {
    const node = mount({ expandable: { enabled: false } });
    node.open();
    await flush();
    const before = node.shadowRoot!.innerHTML;

    node.updateConfig({ expandable: { enabled: true } } as never);
    await flush();
    const after = node.shadowRoot!.innerHTML;

    // Identical rendered state: the expandable flag is inert on the public surface.
    expect(after).toBe(before);
  });
});
