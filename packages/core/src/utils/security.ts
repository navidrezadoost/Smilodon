/**
 * Security utilities for CSP-compliant environments.
 * All utilities are opt-in and do not run by default.
 */

/**
 * HTML Sanitizer interface - developers must provide their own implementation
 * (e.g., DOMPurify) or use the no-op default.
 */
export interface HTMLSanitizer {
  sanitize(html: string): string;
}

/**
 * No-op sanitizer - DOES NOT sanitize HTML.
 * Used by default to avoid forcing a dependency on sanitizer libraries.
 * Developers using untrusted data MUST provide a real sanitizer.
 */
class NoOpSanitizer implements HTMLSanitizer {
  sanitize(html: string): string {
    return html;
  }
}

/**
 * Registry for custom sanitizer implementation.
 * Defaults to no-op - developers must explicitly set a sanitizer.
 */
let globalSanitizer: HTMLSanitizer = new NoOpSanitizer();

/**
 * Set a custom HTML sanitizer (e.g., DOMPurify).
 * 
 * @example
 * import DOMPurify from 'dompurify';
 * setHTMLSanitizer({
 *   sanitize: (html) => DOMPurify.sanitize(html)
 * });
 */
export function setHTMLSanitizer(sanitizer: HTMLSanitizer): void {
  globalSanitizer = sanitizer;
}

/**
 * Get the current HTML sanitizer.
 */
export function getHTMLSanitizer(): HTMLSanitizer {
  return globalSanitizer;
}

/**
 * Sanitize HTML using the registered sanitizer.
 * WARNING: Default is no-op! Set a real sanitizer for untrusted content.
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  return globalSanitizer.sanitize(html);
}

/**
 * Create a text node (CSP-safe alternative to innerHTML for text content).
 * 
 * @param text - Text content
 * @returns Text node
 */
export function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Set text content safely (CSP-compliant).
 * 
 * @param element - Target element
 * @param text - Text content
 */
export function setTextContent(element: Element, text: string): void {
  element.textContent = text;
}

/**
 * Create an element with attributes (CSP-safe).
 * No inline styles or event handlers.
 * 
 * @param tagName - HTML tag name
 * @param attributes - Element attributes (excluding style and on* handlers)
 * @param textContent - Optional text content
 * @returns Created element
 */
export function createElement(
  tagName: string,
  attributes?: Record<string, string>,
  textContent?: string
): HTMLElement {
  const el = document.createElement(tagName);
  
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      // Block dangerous attributes
      if (key.startsWith('on') || key === 'style') {
        console.warn(`[NativeSelect Security] Blocked attribute: ${key}`);
        continue;
      }
      el.setAttribute(key, value);
    }
  }
  
  if (textContent !== undefined) {
    el.textContent = textContent;
  }
  
  return el;
}

/**
 * Set CSS custom properties (CSP-safe way to style elements).
 * 
 * @param element - Target element
 * @param properties - CSS custom properties (e.g., { '--color': 'red' })
 */
export function setCSSProperties(element: HTMLElement, properties: Record<string, string>): void {
  for (const [key, value] of Object.entries(properties)) {
    if (!key.startsWith('--')) {
      console.warn(`[NativeSelect Security] CSS property must start with --: ${key}`);
      continue;
    }
    element.style.setProperty(key, value);
  }
}

/**
 * Feature detection utilities for CSP-restricted environments.
 */
export const CSPFeatures = {
  /**
   * Check if inline scripts are allowed (CSP: script-src 'unsafe-inline').
   */
  hasInlineScripts(): boolean {
    try {
      // Try to create a function (blocked by CSP: script-src without 'unsafe-eval')
      new Function('return true');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if eval is allowed (CSP: script-src 'unsafe-eval').
   */
  hasEval(): boolean {
    try {
      eval('true');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if SharedArrayBuffer is available.
   * Required for some Worker features, blocked without COOP/COEP headers.
   */
  hasSharedArrayBuffer(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  },

  /**
   * Check if Web Workers are available and functional.
   */
  hasWorkers(): boolean {
    try {
      return typeof Worker !== 'undefined';
    } catch {
      return false;
    }
  },

  /**
   * Check if we're in a sandboxed iframe.
   */
  isSandboxed(): boolean {
    try {
      // Sandboxed iframes may not have access to parent
      return window !== window.parent && !window.parent;
    } catch {
      return true;
    }
  },

  /**
   * Check CSP policy via meta tag or SecurityPolicyViolationEvent.
   */
  getCSPDirectives(): string[] {
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    const directives: string[] = [];
    
    metaTags.forEach((meta) => {
      const content = meta.getAttribute('content');
      if (content) {
        directives.push(content);
      }
    });
    
    return directives;
  }
};

/**
 * Runtime environment checks for degraded features.
 */
export interface EnvironmentCapabilities {
  canUseWorkers: boolean;
  canUseSharedArrayBuffer: boolean;
  canUseInlineScripts: boolean;
  canUseEval: boolean;
  isSandboxed: boolean;
  cspDirectives: string[];
}

/**
 * Detect environment capabilities once at initialization.
 */
export function detectEnvironment(): EnvironmentCapabilities {
  return {
    canUseWorkers: CSPFeatures.hasWorkers(),
    canUseSharedArrayBuffer: CSPFeatures.hasSharedArrayBuffer(),
    canUseInlineScripts: CSPFeatures.hasInlineScripts(),
    canUseEval: CSPFeatures.hasEval(),
    isSandboxed: CSPFeatures.isSandboxed(),
    cspDirectives: CSPFeatures.getCSPDirectives()
  };
}

/**
 * Validation for untrusted HTML in templates.
 * Logs warning if no sanitizer is configured.
 */
export function validateTemplate(html: string, source: string): string {
  if (globalSanitizer instanceof NoOpSanitizer) {
    console.warn(
      `[NativeSelect Security] Template from "${source}" contains HTML but no sanitizer is configured. ` +
      `This may be unsafe if the content is untrusted. ` +
      `Call setHTMLSanitizer() with a sanitizer like DOMPurify.`
    );
  }
  return sanitizeHTML(html);
}

/**
 * Check if a string looks like it might contain executable code.
 */
export function containsSuspiciousPatterns(str: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i
  ];
  
  return patterns.some(pattern => pattern.test(str));
}

/**
 * Escape HTML entities for text content.
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escape attribute values.
 */
export function escapeAttribute(attr: string): string {
  return attr
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
