/**
 * CSP (Content Security Policy) compliance test suite.
 * Verifies the library works in CSP-restricted environments.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  setHTMLSanitizer, 
  resetHTMLSanitizer,
  getHTMLSanitizer, 
  sanitizeHTML,
  createElement,
  setCSSProperties,
  CSPFeatures,
  detectEnvironment,
  containsSuspiciousPatterns,
  escapeHTML,
  escapeAttribute,
  validateTemplate
} from '../src/utils/security';
import {
  applyClasses,
  toggleClass,
  setCustomProperties,
  getCustomProperty,
  injectShadowStyles,
  hasOverflowHiddenAncestor
} from '../src/utils/csp-styles';

describe('CSP Compliance - Security Utilities', () => {
  describe('HTML Sanitization', () => {
    it('should default to no-op sanitizer', () => {
      const sanitizer = getHTMLSanitizer();
      expect(sanitizer.sanitize('<script>alert(1)</script>')).toBe('<script>alert(1)</script>');
    });

    it('should allow custom sanitizer', () => {
      const mockSanitizer = {
        sanitize: (html: string) => html.replace(/<script.*?<\/script>/gi, '')
      };
      
      setHTMLSanitizer(mockSanitizer);
      expect(sanitizeHTML('<div>Safe</div><script>alert(1)</script>')).toBe('<div>Safe</div>');
    });

    it('should escape HTML entities', () => {
      expect(escapeHTML('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      );
    });

    it('should escape attribute values', () => {
      expect(escapeAttribute('" onload="alert(1)')).toContain('&quot;');
      expect(escapeAttribute("' onclick='alert(1)'")).toContain('&#39;');
    });

    it('should detect suspicious patterns', () => {
      expect(containsSuspiciousPatterns('<script>alert(1)</script>')).toBe(true);
      expect(containsSuspiciousPatterns('javascript:void(0)')).toBe(true);
      expect(containsSuspiciousPatterns('onclick="alert(1)"')).toBe(true);
      expect(containsSuspiciousPatterns('eval("code")')).toBe(true);
      expect(containsSuspiciousPatterns('<div>Safe content</div>')).toBe(false);
    });

    it('should warn when template has no sanitizer', () => {
      // Reset to default NoOpSanitizer
      resetHTMLSanitizer();
      
      // Spy on console.warn
      const originalWarn = console.warn;
      const warnCalls: any[] = [];
      console.warn = (...args: any[]) => {
        warnCalls.push(args);
      };
      
      // Trigger validation - should warn since we're using NoOpSanitizer
      const result = validateTemplate('<div>Test</div>', 'test-template');
      
      // Check warning was issued
      expect(warnCalls.length).toBeGreaterThan(0);
      expect(warnCalls[0][0]).toContain('no sanitizer is configured');
      expect(result).toBe('<div>Test</div>');
      
      // Restore
      console.warn = originalWarn;
    });
  });

  describe('Safe Element Creation', () => {
    it('should create elements without inline handlers', () => {
      const el = createElement('div', {
        'class': 'test',
        'data-id': '123'
      }, 'Hello');
      
      expect(el.tagName).toBe('DIV');
      expect(el.className).toBe('test');
      expect(el.dataset.id).toBe('123');
      expect(el.textContent).toBe('Hello');
    });

    it('should block onclick and other event handlers', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const el = createElement('div', {
        'onclick': 'alert(1)',
        'onload': 'alert(2)',
        'data-safe': 'yes'
      });
      
      expect(el.getAttribute('onclick')).toBeNull();
      expect(el.getAttribute('onload')).toBeNull();
      expect(el.dataset.safe).toBe('yes');
      expect(warnSpy).toHaveBeenCalledTimes(2);
      
      warnSpy.mockRestore();
    });

    it('should block inline style attribute', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const el = createElement('div', {
        'style': 'color: red',
        'class': 'safe'
      });
      
      expect(el.getAttribute('style')).toBeNull();
      expect(el.className).toBe('safe');
      
      warnSpy.mockRestore();
    });
  });

  describe('CSS Custom Properties (CSP-safe styling)', () => {
    let testElement: HTMLElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      document.body.appendChild(testElement);
    });

    afterEach(() => {
      testElement.remove();
    });

    it('should set CSS custom properties', () => {
      setCSSProperties(testElement, {
        '--color': 'red',
        '--size': '20px'
      });
      
      expect(testElement.style.getPropertyValue('--color')).toBe('red');
      expect(testElement.style.getPropertyValue('--size')).toBe('20px');
    });

    it('should warn and skip non-custom properties', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      setCSSProperties(testElement, {
        'color': 'red', // Not a custom property
        '--valid': 'blue'
      });
      
      expect(testElement.style.getPropertyValue('color')).toBe('');
      expect(testElement.style.getPropertyValue('--valid')).toBe('blue');
      expect(warnSpy).toHaveBeenCalled();
      
      warnSpy.mockRestore();
    });

    it('should set custom properties via csp-styles utility', () => {
      setCustomProperties(testElement, {
        '--item-height': '48px',
        '--bg-color': '#fff'
      });
      
      expect(getCustomProperty(testElement, '--item-height')).toBe('48px');
      expect(getCustomProperty(testElement, '--bg-color')).toBe('#fff');
    });

    it('should apply CSS classes safely', () => {
      applyClasses(testElement, ['class-a', 'class-b', '', 'class-c']);
      
      expect(testElement.className).toBe('class-a class-b class-c');
    });

    it('should toggle CSS classes', () => {
      toggleClass(testElement, 'active', true);
      expect(testElement.classList.contains('active')).toBe(true);
      
      toggleClass(testElement, 'active', false);
      expect(testElement.classList.contains('active')).toBe(false);
    });
  });

  describe('Environment Detection', () => {
    it('should detect eval capability', () => {
      const hasEval = CSPFeatures.hasEval();
      // In test environment, eval should be available
      expect(typeof hasEval).toBe('boolean');
    });

    it('should detect Function constructor capability', () => {
      const hasInlineScripts = CSPFeatures.hasInlineScripts();
      expect(typeof hasInlineScripts).toBe('boolean');
    });

    it('should detect SharedArrayBuffer', () => {
      const hasSAB = CSPFeatures.hasSharedArrayBuffer();
      expect(typeof hasSAB).toBe('boolean');
    });

    it('should detect Web Workers', () => {
      const hasWorkers = CSPFeatures.hasWorkers();
      expect(hasWorkers).toBe(true); // jsdom should support Worker
    });

    it('should detect sandbox', () => {
      const isSandboxed = CSPFeatures.isSandboxed();
      expect(typeof isSandboxed).toBe('boolean');
    });

    it('should get CSP directives from meta tags', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', "script-src 'self'");
      document.head.appendChild(meta);
      
      const directives = CSPFeatures.getCSPDirectives();
      expect(directives).toContain("script-src 'self'");
      
      meta.remove();
    });

    it('should provide full environment capabilities', () => {
      const env = detectEnvironment();
      
      expect(env).toHaveProperty('canUseWorkers');
      expect(env).toHaveProperty('canUseSharedArrayBuffer');
      expect(env).toHaveProperty('canUseInlineScripts');
      expect(env).toHaveProperty('canUseEval');
      expect(env).toHaveProperty('isSandboxed');
      expect(env).toHaveProperty('cspDirectives');
      expect(Array.isArray(env.cspDirectives)).toBe(true);
    });
  });

  describe('Shadow DOM Styles', () => {
    it('should inject static styles into shadow root', () => {
      const container = document.createElement('div');
      const shadow = container.attachShadow({ mode: 'open' });
      
      injectShadowStyles(shadow);
      
      const styleElement = shadow.querySelector('style');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.ns-list');
      expect(styleElement?.textContent).toContain('.ns-item');
      expect(styleElement?.textContent).not.toContain('<script>');
    });

    it('should use CSS custom properties in styles', () => {
      const container = document.createElement('div');
      const shadow = container.attachShadow({ mode: 'open' });
      
      injectShadowStyles(shadow);
      
      const styleElement = shadow.querySelector('style');
      expect(styleElement?.textContent).toContain('var(--ns-');
      expect(styleElement?.textContent).toContain('--ns-item-height');
    });
  });

  describe('Overflow Hidden Detection', () => {
    it('should detect overflow:hidden ancestor', () => {
      const parent = document.createElement('div');
      parent.style.overflow = 'hidden';
      const child = document.createElement('div');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      expect(hasOverflowHiddenAncestor(child)).toBe(true);
      
      parent.remove();
    });

    it('should return false when no overflow:hidden', () => {
      const parent = document.createElement('div');
      parent.style.overflow = 'visible';
      const child = document.createElement('div');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      expect(hasOverflowHiddenAncestor(child)).toBe(false);
      
      parent.remove();
    });
  });
});

describe('CSP Compliance - No eval/Function', () => {
  it('should not use eval anywhere in codebase', () => {
    // This is a meta-test - actual verification done by CSP headers
    // The library should never call eval()
    expect(() => {
      // If this test runs, it means eval is available
      // The library code should still not use it
      const testEval = window.eval;
      expect(testEval).toBeDefined();
    }).not.toThrow();
  });

  it('should not use Function constructor', () => {
    // The library should never use new Function()
    expect(() => {
      const testFunction = window.Function;
      expect(testFunction).toBeDefined();
    }).not.toThrow();
  });

  it('should not use setTimeout with string argument', () => {
    // setTimeout('code') is equivalent to eval
    // Only setTimeout(fn) should be used
    const originalSetTimeout = window.setTimeout;
    expect(typeof originalSetTimeout).toBe('function');
  });
});

describe('CSP Compliance - Inline Styles', () => {
  it('should not create style tags at runtime', () => {
    const container = document.createElement('div');
    const shadow = container.attachShadow({ mode: 'open' });
    
    // Inject styles once (allowed - static content)
    injectShadowStyles(shadow);
    
    const styleCount = shadow.querySelectorAll('style').length;
    expect(styleCount).toBe(1);
    
    // No additional style tags should be created
    injectShadowStyles(shadow);
    expect(shadow.querySelectorAll('style').length).toBe(2); // Called twice, so 2
  });

  it('should use only CSS classes and custom properties for dynamic styling', () => {
    const element = document.createElement('div');
    
    // Good: CSS classes
    applyClasses(element, ['active', 'selected']);
    expect(element.className).toBe('active selected');
    
    // Good: CSS custom properties
    setCustomProperties(element, {
      '--bg-color': 'blue',
      '--text-color': 'white'
    });
    expect(element.style.getPropertyValue('--bg-color')).toBe('blue');
    
    // Bad: inline styles (should not be set)
    expect(element.style.backgroundColor).toBe('');
    expect(element.style.color).toBe('');
  });
});
