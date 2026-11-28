/**
 * W1-P1.6 Task 2 — CSP-compliant styling utilities characterization
 * (public surface only).
 *
 * Characterizes the exports of `packages/core/src/utils/csp-styles.ts` through
 * the PUBLIC package import (`packages/core/src/index.ts`). No `as any`, no
 * private access; assertions observe returned values, mutated DOM attributes/
 * class lists, `<style>` insertion, captured console.warn calls, or the
 * computed style read through the browser API the helper itself uses.
 *
 * Contracts: API-070..API-074, CONFIG-029.
 *
 * ENVIRONMENT NOTES (conservative jsdom treatment):
 *  - `process.env.NODE_ENV` is `'test'` in this runner, so the development-only
 *    warning branches of `setCustomProperties` and `warnCSPViolation` execute.
 *    Production-CONDITIONED source behavior is verified by stubbing
 *    `NODE_ENV='production'` (vi.stubEnv). This exercises the SOURCE under a
 *    controlled environment — it does NOT certify a compiled production
 *    artifact, nor compatibility with an enforced browser Content Security
 *    Policy (no such enforcement is exercised here).
 *  - jsdom's `getComputedStyle` reflects *inline* custom properties and inline
 *    `overflow`, so those helpers are testable here. However, jsdom performs no
 *    real layout, so we do NOT claim layout-derived computed-style coverage;
 *    `hasOverflowHiddenAncestor` is characterized only via inline-set overflow.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyClasses,
  toggleClass,
  setCustomProperties,
  getCustomProperty,
  removeCustomProperty,
  defaultTheme,
  applyDefaultTheme,
  shadowDOMStyles,
  injectShadowStyles,
  hasOverflowHiddenAncestor,
  warnCSPViolation,
} from '../src/index.js';

/** Detached element for class/style mutation tests (no document.body needed). */
function el(): HTMLElement {
  return document.createElement('div');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  document.body.style.overflow = '';
});

/**
 * API-070 — applyClasses joins non-empty classes into className; toggleClass
 * toggles a class with an optional force (add/remove) argument.
 */
describe('API-070: class application and toggling', () => {
  it('API-070: applyClasses joins non-empty class names in order, dropping falsy entries', () => {
    const node = el();
    applyClasses(node, ['class-a', '', 'class-b', 'class-c']);
    expect(node.className).toBe('class-a class-b class-c');
  });

  it('API-070: applyClasses REPLACES existing classes (assigns className, not additive)', () => {
    const node = el();
    node.className = 'pre-existing';
    applyClasses(node, ['only']);
    expect(node.className).toBe('only');
    expect(node.classList.contains('pre-existing')).toBe(false);
  });

  it('API-070: applyClasses with all-empty input yields an empty className', () => {
    const node = el();
    node.className = 'old';
    applyClasses(node, ['', '']);
    expect(node.className).toBe('');
  });

  it('API-070: toggleClass toggles presence when no force is given', () => {
    const node = el();
    toggleClass(node, 'active');
    expect(node.classList.contains('active')).toBe(true);
    toggleClass(node, 'active');
    expect(node.classList.contains('active')).toBe(false);
  });

  it('API-070: toggleClass honors forced state (true adds, false removes) idempotently', () => {
    const node = el();
    toggleClass(node, 'on', true);
    toggleClass(node, 'on', true);
    expect(node.classList.contains('on')).toBe(true);
    toggleClass(node, 'on', false);
    toggleClass(node, 'on', false);
    expect(node.classList.contains('on')).toBe(false);
  });
});

/**
 * API-071 — custom-property family.
 *
 * PREFIX-ENFORCEMENT ASYMMETRY (T2-F02): only the SETTER enforces the `--`
 * prefix. The getter and remover do NOT validate the prefix — they delegate
 * arbitrary property names to `getComputedStyle().getPropertyValue()` and
 * `style.removeProperty()` respectively, so they also act on ordinary CSS
 * properties (e.g. `color`, `display`). This is characterized as observed
 * behavior, not a call to add validation.
 *
 *   setCustomProperties  -> prefix enforced (warn+skip non-'--')
 *   getCustomProperty    -> prefix NOT enforced (reads any computed property)
 *   removeCustomProperty -> prefix NOT enforced (removes any inline property)
 */
describe('API-071: custom-property set/get/remove family (setter-only prefix enforcement)', () => {
  it('API-071: setCustomProperties applies --prefixed custom properties', () => {
    const node = el();
    setCustomProperties(node, { '--item-height': '48px', '--bg': '#fff' });
    expect(node.style.getPropertyValue('--item-height')).toBe('48px');
    expect(node.style.getPropertyValue('--bg')).toBe('#fff');
  });

  it('API-071: setCustomProperties warns and skips non-custom keys in development (NODE_ENV=test)', () => {
    const node = el();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setCustomProperties(node, { color: 'red', '--ok': 'blue' });
    expect(node.style.getPropertyValue('color')).toBe('');
    expect(node.style.getPropertyValue('--ok')).toBe('blue');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('must start with --');
    expect(String(warn.mock.calls[0][0])).toContain('color');
  });

  it('API-071: setCustomProperties does NOT warn for non-custom keys under NODE_ENV=production (still skips)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const node = el();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setCustomProperties(node, { color: 'red', '--ok': 'green' });
    expect(warn).not.toHaveBeenCalled();
    expect(node.style.getPropertyValue('color')).toBe('');
    expect(node.style.getPropertyValue('--ok')).toBe('green');
  });

  it('API-071: getCustomProperty returns the trimmed computed value, or "" when unset', () => {
    const node = el();
    document.body.appendChild(node);
    node.style.setProperty('--x', '  10px  ');
    try {
      expect(getCustomProperty(node, '--x')).toBe('10px');
      expect(getCustomProperty(node, '--missing')).toBe('');
    } finally {
      node.remove();
    }
  });

  it('API-071: removeCustomProperty removes a previously set custom property', () => {
    const node = el();
    setCustomProperties(node, { '--gone': '1' });
    expect(node.style.getPropertyValue('--gone')).toBe('1');
    removeCustomProperty(node, '--gone');
    expect(node.style.getPropertyValue('--gone')).toBe('');
  });

  it('API-071: getCustomProperty reads an ORDINARY CSS property too (no -- prefix enforced)', () => {
    const node = el();
    document.body.appendChild(node);
    node.style.setProperty('color', 'rgb(0, 128, 0)');
    node.style.setProperty('display', 'inline-block');
    try {
      // No '--' prefix: the getter still reads the computed value.
      expect(getCustomProperty(node, 'color')).toBe('rgb(0, 128, 0)');
      expect(getCustomProperty(node, 'display')).toBe('inline-block');
    } finally {
      node.remove();
    }
  });

  it('API-071: removeCustomProperty removes an ORDINARY CSS property too (no -- prefix enforced)', () => {
    const node = el();
    node.style.setProperty('color', 'blue');
    node.style.setProperty('--keep', 'v');
    expect(node.style.getPropertyValue('color')).toBe('blue');
    removeCustomProperty(node, 'color');
    expect(node.style.getPropertyValue('color')).toBe('');
    // Unrelated custom property is untouched.
    expect(node.style.getPropertyValue('--keep')).toBe('v');
  });
});

/**
 * CONFIG-029 — theme surface: defaultTheme is a stable map of `--ns-*` values;
 * applyDefaultTheme applies them; shadowDOMStyles is a STATIC string containing
 * `:host`/`.ns-*` selectors and no `<script>`.
 */
describe('CONFIG-029: default theme, application, and static shadow styles', () => {
  // Independently-defined expected theme (T2-F03). This literal is NOT derived
  // from `defaultTheme`; deleting/altering any entry breaks the assertion. We do
  // NOT assert immutability — the exported object is not frozen.
  const EXPECTED_DEFAULT_THEME: Record<string, string> = {
    '--ns-item-height': '40px',
    '--ns-item-padding': '8px 12px',
    '--ns-item-bg': 'transparent',
    '--ns-item-hover-bg': 'rgba(0, 0, 0, 0.05)',
    '--ns-item-selected-bg': 'rgba(0, 102, 204, 0.1)',
    '--ns-item-active-bg': 'rgba(0, 102, 204, 0.2)',
    '--ns-item-color': 'inherit',
    '--ns-item-selected-color': '#0066cc',
    '--ns-border-color': '#ccc',
    '--ns-border-radius': '4px',
    '--ns-focus-outline': '2px solid #0066cc',
    '--ns-font-size': '14px',
    '--ns-font-family': 'system-ui, -apple-system, sans-serif',
  };

  it('CONFIG-029: defaultTheme is a stable 13-entry map matching the expected pinned values', () => {
    // Key set pinned exactly (count + membership).
    expect(Object.keys(defaultTheme).sort()).toEqual(Object.keys(EXPECTED_DEFAULT_THEME).sort());
    expect(Object.keys(defaultTheme)).toHaveLength(13);
    // Every value pinned against the independent expected object.
    expect(defaultTheme).toEqual(EXPECTED_DEFAULT_THEME);
    // Naming convention.
    for (const key of Object.keys(defaultTheme)) expect(key.startsWith('--ns-')).toBe(true);
  });

  it('CONFIG-029: applyDefaultTheme writes every defaultTheme entry onto the element', () => {
    const node = el();
    applyDefaultTheme(node);
    for (const [key, value] of Object.entries(EXPECTED_DEFAULT_THEME)) {
      expect(node.style.getPropertyValue(key)).toBe(value);
    }
  });

  it('CONFIG-029: shadowDOMStyles is a static string with :host and .ns-* selectors and NO <script>', () => {
    expect(typeof shadowDOMStyles).toBe('string');
    expect(shadowDOMStyles).toContain(':host');
    expect(shadowDOMStyles).toContain('.ns-item');
    expect(shadowDOMStyles).toContain('var(--ns-');
    expect(/<script/i.test(shadowDOMStyles)).toBe(false);
  });
});

/**
 * API-072 — injectShadowStyles appends a single <style> element (static text)
 * to a shadow root; it is additive on repeated calls (no dedupe).
 */
describe('API-072: shadow-root style injection', () => {
  it('API-072: injectShadowStyles appends one <style> whose text is the static shadowDOMStyles', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    injectShadowStyles(shadow);
    const styles = shadow.querySelectorAll('style');
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toBe(shadowDOMStyles);
  });

  it('API-072: injectShadowStyles is additive (no dedupe) on repeated calls', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    injectShadowStyles(shadow);
    injectShadowStyles(shadow);
    expect(shadow.querySelectorAll('style').length).toBe(2);
  });
});

/**
 * API-073 — hasOverflowHiddenAncestor walks the parentElement chain for computed
 * overflow hidden/clip, EXCLUDING document.body. Characterized via inline-set
 * overflow (jsdom reflects inline overflow in getComputedStyle; real layout is
 * out of scope).
 *
 * IMPORTANT (T2-F01): the helper is PARENT-CHAIN based — it does NOT consult
 * `element.isConnected`. A DETACHED subtree can still have an overflow-hidden
 * ancestor and yield `true`; only a PARENTLESS element yields `false`.
 */
describe('API-073: overflow-hidden ancestor detection (parent-chain, body-excluded)', () => {
  it('API-073: detects an overflow:hidden ancestor', () => {
    const parent = el();
    parent.style.overflow = 'hidden';
    const child = el();
    parent.appendChild(child);
    document.body.appendChild(parent);
    try {
      expect(hasOverflowHiddenAncestor(child)).toBe(true);
    } finally {
      parent.remove();
    }
  });

  it('API-073: detects overflow:clip and a non-immediate (grandparent) ancestor', () => {
    const grand = el();
    grand.style.overflow = 'clip';
    const mid = el();
    const leaf = el();
    grand.appendChild(mid);
    mid.appendChild(leaf);
    document.body.appendChild(grand);
    try {
      expect(hasOverflowHiddenAncestor(leaf)).toBe(true);
    } finally {
      grand.remove();
    }
  });

  it('API-073: returns false when no ancestor sets overflow hidden/clip', () => {
    const parent = el();
    parent.style.overflow = 'visible';
    const child = el();
    parent.appendChild(child);
    document.body.appendChild(parent);
    try {
      expect(hasOverflowHiddenAncestor(child)).toBe(false);
    } finally {
      parent.remove();
    }
  });

  it('API-073: EXCLUDES document.body (a direct body child with body overflow:hidden reports false)', () => {
    const child = el();
    document.body.appendChild(child);
    try {
      document.body.style.overflow = 'hidden';
      expect(hasOverflowHiddenAncestor(child)).toBe(false);
    } finally {
      child.remove();
    }
  });

  it('API-073: a detached subtree WITH an overflow:hidden ancestor reports true (parent-chain, not isConnected)', () => {
    // Both nodes are disconnected from the document, yet the parent-chain walk
    // still observes the overflow:hidden ancestor — proving the helper does not
    // gate on element.isConnected.
    const parent = el();
    parent.style.overflow = 'hidden';
    const child = el();
    parent.appendChild(child); // detached subtree (never appended to document)
    expect(child.isConnected).toBe(false);
    expect(hasOverflowHiddenAncestor(child)).toBe(true);
  });

  it('API-073: a PARENTLESS element reports false (no parent chain to walk)', () => {
    const lonely = el();
    expect(lonely.parentElement).toBeNull();
    expect(hasOverflowHiddenAncestor(lonely)).toBe(false);
  });
});

/**
 * API-074 — warnCSPViolation warns ONLY in non-production; the message names
 * both the feature and the fallback. Under NODE_ENV=production it is silent.
 */
describe('API-074: CSP violation warning (dev-only, names feature+fallback)', () => {
  it('API-074: warns in development naming both the feature and the fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnCSPViolation('inline-script', 'external-file');
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = String(warn.mock.calls[0][0]);
    expect(msg).toContain('inline-script');
    expect(msg).toContain('external-file');
    expect(msg).toContain('Content Security Policy');
  });

  it('API-074: is SILENT under NODE_ENV=production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnCSPViolation('inline-script', 'external-file');
    expect(warn).not.toHaveBeenCalled();
  });
});
