/**
 * W1-P1.6 Task 1 — Security utilities characterization (public surface only).
 *
 * Characterizes the HTML-safety and environment-detection exports of
 * `packages/core/src/utils/security.ts` through the PUBLIC package import.
 * No `as any`, no private access; assertions observe returned values, mutated
 * DOM, or captured console.warn calls.
 *
 * Contracts: API-063..API-069, CONFIG-027, CONFIG-028.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setHTMLSanitizer,
  getHTMLSanitizer,
  sanitizeHTML,
  validateTemplate,
  createElement,
  createTextNode,
  setTextContent,
  setCSSProperties,
  containsSuspiciousPatterns,
  escapeHTML,
  escapeAttribute,
  CSPFeatures,
  detectEnvironment,
} from '../src/index.js';
import type { HTMLSanitizer } from '../src/index.js';

/**
 * The package entry exposes `setHTMLSanitizer` but NOT `resetHTMLSanitizer`
 * (public-boundary finding recorded on API-063). The genuine default
 * `NoOpSanitizer` is a private, unexported class, so once `setHTMLSanitizer`
 * is called it cannot be restored. Ordering therefore matters: the tests that
 * depend on the pristine default (the no-op identity check for API-063 and the
 * validateTemplate default-warning for API-064) run FIRST, before any test
 * replaces the global with a custom sanitizer.
 *
 * `identitySanitizer` is used only to restore identity *behaviour* (not the
 * private NoOpSanitizer class) between tests that install custom sanitizers.
 */
const identitySanitizer: HTMLSanitizer = { sanitize: (html) => html };

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * API-063 — Sanitizer registry: default is a no-op identity sanitizer; a custom
 * sanitizer round-trips through get/sanitizeHTML. The reset function exists in
 * source but is NOT part of the public package surface.
 *
 * ORDERING: the pristine-default assertions (API-063 default identity and
 * API-064 default warning) MUST run before any `setHTMLSanitizer` call, because
 * the private NoOpSanitizer default cannot be restored once replaced.
 */
describe('API-063: HTML sanitizer registry and boundary', () => {
  it('API-063: default sanitizer is a no-op identity that returns input unchanged', () => {
    const sanitizer = getHTMLSanitizer();
    const dangerous = '<script>alert(1)</script>';
    expect(sanitizer.sanitize(dangerous)).toBe(dangerous);
    expect(sanitizeHTML(dangerous)).toBe(dangerous);
  });

  it('API-064: warns and returns sanitized output under the pristine default no-op sanitizer', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = validateTemplate('<div>x</div>', 'unit-test');
    expect(out).toBe('<div>x</div>');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('no sanitizer is configured');
    expect(String(warn.mock.calls[0][0])).toContain('unit-test');
    warn.mockRestore();
  });

  it('API-063: resetHTMLSanitizer is NOT part of the public package surface', async () => {
    const pkg = await import('../src/index.js');
    expect('resetHTMLSanitizer' in pkg).toBe(false);
  });

  it('API-063: setHTMLSanitizer installs a custom sanitizer returned by the getter and used by sanitizeHTML', () => {
    const custom: HTMLSanitizer = { sanitize: (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '') };
    setHTMLSanitizer(custom);
    expect(getHTMLSanitizer()).toBe(custom);
    expect(sanitizeHTML('<div>safe</div><script>alert(1)</script>')).toBe('<div>safe</div>');
  });

  it('API-063: resetting to no-op behaviour is available only via the public setter (no public reset export)', () => {
    setHTMLSanitizer({ sanitize: () => 'REDACTED' });
    expect(sanitizeHTML('<b>x</b>')).toBe('REDACTED');
    setHTMLSanitizer(identitySanitizer);
    expect(sanitizeHTML('<b>x</b>')).toBe('<b>x</b>');
  });
});

/**
 * API-064 — validateTemplate: under a CUSTOM sanitizer it does NOT warn and
 * returns the custom sanitizer's output. (The undefined-sanitizer warning case
 * runs above, before any setter, against the pristine default.)
 */
describe('API-064: validateTemplate non-warning under a custom sanitizer', () => {
  it('API-064: does not warn under a custom sanitizer, and returns its sanitized output', () => {
    setHTMLSanitizer({ sanitize: (html) => html.toUpperCase() });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = validateTemplate('<div>x</div>', 'unit-test');
    expect(out).toBe('<DIV>X</DIV>');
    expect(warn).not.toHaveBeenCalled();
  });
});

/**
 * API-065 — createElement applies safe attributes and textContent, and blocks
 * `on*` event-handler attributes and the inline `style` attribute with a warning.
 */
describe('API-065: createElement safe attribute construction', () => {
  it('API-065: applies safe attributes and textContent', () => {
    const el = createElement('div', { class: 'c1', 'data-id': '42' }, 'Hello');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('c1');
    expect(el.dataset.id).toBe('42');
    expect(el.textContent).toBe('Hello');
  });

  it('API-065: blocks on* and style attributes (not set) and warns once per blocked attribute', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = createElement('div', {
      onclick: 'alert(1)',
      onload: 'alert(2)',
      style: 'color: red',
      'data-ok': 'yes',
    });
    expect(el.getAttribute('onclick')).toBeNull();
    expect(el.getAttribute('onload')).toBeNull();
    expect(el.getAttribute('style')).toBeNull();
    expect(el.dataset.ok).toBe('yes');
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('API-065: creates an element with no attributes/text when none provided', () => {
    const el = createElement('span');
    expect(el.tagName).toBe('SPAN');
    expect(el.attributes.length).toBe(0);
    expect(el.textContent).toBe('');
  });
});

/**
 * API-066 — setCSSProperties sets only `--`-prefixed custom properties;
 * non-custom keys are skipped with a warning and never applied.
 */
describe('API-066: setCSSProperties custom-property-only boundary', () => {
  it('API-066: sets --prefixed custom properties', () => {
    const el = document.createElement('div');
    setCSSProperties(el, { '--color': 'red', '--size': '20px' });
    expect(el.style.getPropertyValue('--color')).toBe('red');
    expect(el.style.getPropertyValue('--size')).toBe('20px');
  });

  it('API-066: warns and skips non-custom properties without applying them', () => {
    const el = document.createElement('div');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setCSSProperties(el, { color: 'red', '--valid': 'blue' });
    expect(el.style.getPropertyValue('color')).toBe('');
    expect(el.style.getPropertyValue('--valid')).toBe('blue');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('color');
  });
});

/**
 * API-067 — createTextNode and setTextContent build/assign text without HTML parsing.
 */
describe('API-067: safe text-node construction', () => {
  it('API-067: createTextNode produces a text node whose data is not parsed as HTML', () => {
    const node = createTextNode('<b>x</b>');
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.data).toBe('<b>x</b>');
  });

  it('API-067: setTextContent assigns literal text (no element parsing)', () => {
    const el = document.createElement('div');
    setTextContent(el, '<script>alert(1)</script>');
    expect(el.childNodes.length).toBe(1);
    expect(el.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(el.textContent).toBe('<script>alert(1)</script>');
    expect(el.querySelector('script')).toBeNull();
  });
});

/**
 * API-068 — escapeHTML encodes text via textContent; escapeAttribute encodes
 * the five HTML-significant characters.
 */
describe('API-068: HTML/attribute escaping', () => {
  it('API-068: escapeHTML encodes markup so it cannot form elements', () => {
    expect(escapeHTML('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert("XSS")&lt;/script&gt;',
    );
  });

  it('API-068: escapeAttribute encodes & " \' < >', () => {
    expect(escapeAttribute('&')).toBe('&amp;');
    expect(escapeAttribute('"')).toBe('&quot;');
    expect(escapeAttribute("'")).toBe('&#39;');
    expect(escapeAttribute('<')).toBe('&lt;');
    expect(escapeAttribute('>')).toBe('&gt;');
    expect(escapeAttribute('" onload="alert(1)')).toBe('&quot; onload=&quot;alert(1)');
  });
});

/**
 * API-069 — containsSuspiciousPatterns detects executable-code heuristics and
 * returns false for safe markup.
 */
describe('API-069: suspicious-pattern detection', () => {
  it('API-069: flags <script>, javascript:, on*=, eval(, Function(, setTimeout(, setInterval( patterns', () => {
    expect(containsSuspiciousPatterns('<script>alert(1)</script>')).toBe(true);
    expect(containsSuspiciousPatterns('javascript:void(0)')).toBe(true);
    expect(containsSuspiciousPatterns('onclick="alert(1)"')).toBe(true);
    expect(containsSuspiciousPatterns('eval("code")')).toBe(true);
    expect(containsSuspiciousPatterns('new Function("return 1")')).toBe(true);
    expect(containsSuspiciousPatterns('setTimeout("x", 0)')).toBe(true);
    expect(containsSuspiciousPatterns('setInterval("x", 0)')).toBe(true);
  });

  it('API-069: returns false for safe markup and plain text', () => {
    expect(containsSuspiciousPatterns('<div>Safe content</div>')).toBe(false);
    expect(containsSuspiciousPatterns('just some words')).toBe(false);
  });
});

/**
 * CONFIG-027 — CSPFeatures detection family: each capability predicate returns a
 * boolean and does not throw; getCSPDirectives reads CSP meta-tag content values.
 */
describe('CONFIG-027: CSPFeatures environment detection family', () => {
  it('CONFIG-027: capability predicates return booleans without throwing', () => {
    for (const fn of [
      CSPFeatures.hasInlineScripts,
      CSPFeatures.hasEval,
      CSPFeatures.hasSharedArrayBuffer,
      CSPFeatures.hasWorkers,
      CSPFeatures.isSandboxed,
    ]) {
      expect(() => fn()).not.toThrow();
      expect(typeof fn()).toBe('boolean');
    }
  });

  it('CONFIG-027: getCSPDirectives returns [] when no CSP meta tag is present', () => {
    document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach((m) => m.remove());
    expect(CSPFeatures.getCSPDirectives()).toEqual([]);
  });

  it('CONFIG-027: getCSPDirectives reads content values from CSP meta tags', () => {
    document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach((m) => m.remove());
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "script-src 'self'");
    document.head.appendChild(meta);
    try {
      expect(CSPFeatures.getCSPDirectives()).toContain("script-src 'self'");
    } finally {
      meta.remove();
    }
  });
});

/**
 * CONFIG-028 — detectEnvironment returns the six-field EnvironmentCapabilities
 * object consistent with CSPFeatures.
 */
describe('CONFIG-028: detectEnvironment snapshot', () => {
  it('CONFIG-028: returns the full six-field capability object with cspDirectives as an array', () => {
    const env = detectEnvironment();
    expect(env).toHaveProperty('canUseWorkers');
    expect(env).toHaveProperty('canUseSharedArrayBuffer');
    expect(env).toHaveProperty('canUseInlineScripts');
    expect(env).toHaveProperty('canUseEval');
    expect(env).toHaveProperty('isSandboxed');
    expect(env).toHaveProperty('cspDirectives');
    expect(Array.isArray(env.cspDirectives)).toBe(true);
    for (const key of [
      'canUseWorkers',
      'canUseSharedArrayBuffer',
      'canUseInlineScripts',
      'canUseEval',
      'isSandboxed',
    ] as const) {
      expect(typeof env[key]).toBe('boolean');
    }
  });

  it('CONFIG-028: fields agree with the individual CSPFeatures predicates', () => {
    document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach((m) => m.remove());
    const env = detectEnvironment();
    expect(env.canUseWorkers).toBe(CSPFeatures.hasWorkers());
    expect(env.canUseSharedArrayBuffer).toBe(CSPFeatures.hasSharedArrayBuffer());
    expect(env.canUseInlineScripts).toBe(CSPFeatures.hasInlineScripts());
    expect(env.canUseEval).toBe(CSPFeatures.hasEval());
    expect(env.isSandboxed).toBe(CSPFeatures.isSandboxed());
    expect(env.cspDirectives).toEqual(CSPFeatures.getCSPDirectives());
  });
});
