# Security Quick Reference Card

## CSP Headers (Copy & Paste)

### Minimum (Development)
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self' blob:;
```

### Recommended (Production)
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self' blob:; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';
```

### Strict (No Workers)
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'none'; object-src 'none';
```

---

## Quick Start

### 1. Basic Usage (Safe by Default)
```typescript
import { NativeSelect } from '@native-select/react';

// ✅ Safe - no user HTML
<NativeSelect 
  items={items}
  onSelect={(data) => console.log(data)}
/>
```

### 2. With HTML Templates (Add Sanitizer)
```typescript
import DOMPurify from 'dompurify';
import { setHTMLSanitizer } from '@native-select/core';

// ✅ One-time setup
setHTMLSanitizer({
  sanitize: (html) => DOMPurify.sanitize(html)
});

// Now safe for templates
<NativeSelect
  items={items}
  optionTemplate={(item) => `<div>${item.html}</div>`}
/>
```

### 3. Check Environment
```typescript
import { detectEnvironment } from '@native-select/core';

const env = detectEnvironment();
console.log('Workers:', env.canUseWorkers);
console.log('SAB:', env.canUseSharedArrayBuffer);
console.log('Sandboxed:', env.isSandboxed);
```

---

## Common Patterns

### Safe Styling
```typescript
import { setCustomProperties, applyClasses } from '@native-select/core';

// ✅ Good
setCustomProperties(el, { '--color': 'red' });
applyClasses(el, ['active', 'selected']);

// ❌ Bad
el.style.backgroundColor = 'red';
el.setAttribute('style', 'color: red');
```

### Safe Element Creation
```typescript
import { createElement } from '@native-select/core';

// ✅ Good
const div = createElement('div', {
  'class': 'item',
  'data-id': '123'
}, 'Text content');

// ❌ Bad
div.innerHTML = `<div onclick="alert(1)">${userInput}</div>`;
```

### Overflow Detection
```typescript
import { hasOverflowHiddenAncestor } from '@native-select/core';

if (hasOverflowHiddenAncestor(select)) {
  select.setAttribute('strategy', 'fixed');
  select.setAttribute('portal', 'false');
}
```

---

## Testing

```bash
# CSP tests
npm run test:csp

# Shadow DOM tests
npm run test:shadow-dom

# Manual testing with CSP server
node packages/core/tests/csp-server.js
# Open http://localhost:8000/tests/csp-test.html
```

---

## Troubleshooting

### "CSP violation: eval"
✅ **Solution**: Library doesn't use eval - check your own code or dependencies

### "CSP violation: inline style"
✅ **Solution**: Use `setCustomProperties()` instead of `element.style.property = value`

### "Workers not loading"
✅ **Solution**: Add `worker-src 'self' blob:` to CSP header

### "SharedArrayBuffer undefined"
✅ **Solution**: Add COOP/COEP headers or library falls back automatically

### "Template HTML unsafe"
✅ **Solution**: Call `setHTMLSanitizer()` with DOMPurify before using templates

---

## Checklist

- [ ] CSP headers configured
- [ ] `setHTMLSanitizer()` called if using templates
- [ ] Environment detection checked if needed
- [ ] Overflow:hidden fallback handled
- [ ] Tests passing locally
- [ ] Browser console checked for violations
- [ ] Production CSP tested

---

## Support

- 📖 Full guide: `.azure/phase9-security-guide.md`
- 🧪 Test suite: `packages/core/tests/csp.spec.ts`
- 🌐 Manual test: `packages/core/tests/csp-test.html`
- 📝 API docs: README.md

**Questions?** Check the security guide for comprehensive documentation.
