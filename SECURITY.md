# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          | End of Life |
| ------- | ------------------ | ----------- |
| 0.2.x   | :white_check_mark: | TBD         |
| 0.1.x   | :white_check_mark: | 2026-06-01  |
| < 0.1   | :x:                | -           |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

**Important:** Do not open a public GitHub issue for security vulnerabilities.

### 2. Send a Private Report

Email security details to: **security@smilodon.dev**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. Encryption (Optional)

For sensitive reports, you may encrypt your message using our PGP key:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[PGP key would be here in production]
-----END PGP PUBLIC KEY BLOCK-----
```

### 4. Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 5 business days
- **Fix Timeline**: Depends on severity
  - **Critical**: 1-3 days
  - **High**: 1-2 weeks
  - **Medium**: 2-4 weeks
  - **Low**: Next release cycle

### 5. Disclosure Policy

- We will work with you to understand and validate the issue
- A fix will be developed and tested
- A security advisory will be published
- Credit will be given to the reporter (unless anonymity is requested)

## Security Features

### Content Security Policy (CSP) — not certified

No blanket strict-CSP compatibility claim is established. The maintained Core source contains an `eval('true')` capability probe, and worker creation or other application integrations may also be affected by a site's policy. Test the exact built package and deployment policy; do not assume that `script-src 'self'` is sufficient.

The policy below is an example application header, not a tested compatibility guarantee:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self'; 
               img-src 'self' data:; 
               font-src 'self';">
```

### Handling untrusted content (no blanket XSS guarantee)

The default Core label path uses text content, but custom renderers and legacy HTML-string paths can introduce HTML sinks. Treat renderer output, icons, templates, and data from untrusted sources as sensitive input. The examples below are application guidance, not a claim that every Core path automatically sanitizes content.

1. **Default Safe Rendering**
   ```typescript
   // Safe by default - uses textContent
   option.textContent = userInput;
   ```

2. **Application-owned HTML sanitization**
   ```typescript
   import { setHTMLSanitizer } from '@smilodon/core';
   import DOMPurify from 'dompurify';
   
   setHTMLSanitizer({
     sanitize: (html) => DOMPurify.sanitize(html)
   });
   ```

3. Validate data at the application boundary using the validation rules appropriate to that application. The package does not expose a universal `validateInput()` function.

### Shadow DOM Isolation

**Encapsulation properties (not a security boundary):**

- Shadow DOM scopes internal markup and many styles, but does not isolate composed events or make untrusted content safe.

```typescript
class EnhancedSelect extends HTMLElement {
  private shadow: ShadowRoot;
  
  constructor() {
    super();
    // Mode 'open' for debugging, 'closed' for production (if needed)
    this.shadow = this.attachShadow({ mode: 'open' });
  }
}
```

### Dependency Security

**Practices:**

- Regular dependency audits with `npm audit`
- Automated Dependabot updates
- Minimal dependencies (zero runtime dependencies)
- All dev dependencies vetted

**Run Security Audit:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force
```

### Input Validation

**All inputs are validated:**

```typescript
interface SelectItem {
  value: string | number;  // Validated type
  label: string;           // Sanitized before rendering
  disabled?: boolean;      // Type-safe boolean
}

function validateItem(item: unknown): SelectItem {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item');
  }
  
  const { value, label, disabled } = item as any;
  
  if (value === undefined || value === null) {
    throw new Error('Item value is required');
  }
  
  if (typeof label !== 'string') {
    throw new Error('Item label must be a string');
  }
  
  return {
    value,
    label: sanitizeString(label),
    disabled: Boolean(disabled)
  };
}
```

## Known Vulnerabilities

### Current Status: None

Last security audit: 2025-12-10
Next scheduled audit: 2026-01-10

### Historical Vulnerabilities

No security vulnerabilities have been reported or discovered to date.

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   ```bash
   npm update @smilodon/core
   ```

2. **Use Subresource Integrity (SRI)**
   ```html
   <script 
     src="https://cdn.example.com/smilodon.js"
     integrity="sha384-..." 
     crossorigin="anonymous">
   </script>
   ```

3. **Enable CSP Headers**
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'
   ```

4. **Sanitize User Content**
   ```typescript
   import DOMPurify from 'dompurify';
   
   const sanitized = DOMPurify.sanitize(userContent);
   ```

5. **Validate Input Data**
   ```typescript
   // Always validate items from untrusted sources
   const items = untrustedData.map(validateItem);
   ```

### For Contributors

1. **Never Commit Secrets**
   - No API keys, passwords, or tokens in code
   - Use environment variables
   - Add sensitive patterns to `.gitignore`

2. **Review Third-Party Code**
   - Audit all new dependencies
   - Check for known vulnerabilities
   - Prefer well-maintained packages

3. **Follow Secure Coding Practices**
   - Validate all inputs
   - Sanitize all outputs
   - Use parameterized queries (if applicable)
   - Avoid dangerous functions (`eval`, `innerHTML`)

4. **Test Security**
   ```bash
   # Run CSP compliance tests
   npm run test:csp
   
   # Run security audit
   npm audit
   
   # Run all security tests
   npm run test:security
   ```

## Compliance

### Standards

- **OWASP Top 10**: Protection against common web vulnerabilities
- **CWE/SANS Top 25**: Mitigation of most dangerous software weaknesses
- **CSP**: Compatibility is policy-dependent and has not been certified; the Core source contains an `eval('true')` capability probe.
- **WCAG**: Conformance is not established or certified; automated checks do not replace manual assistive-technology review.

### Certifications

No completed independent SOC 2 or ISO 27001 audit/certification is established by this repository. Do not treat the linked historical control-mapping draft as proof of certification.

See [SOC2-COMPLIANCE.md](./docs/compliance/SOC2-COMPLIANCE.md) for details.

## Security Scanning

### Automated Scanning

**GitHub Security:**
- Dependabot alerts enabled
- Secret scanning enabled
- Code scanning (CodeQL) enabled

**CI/CD Pipeline:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Manual Security Testing

**Recommended Tools:**

1. **OWASP ZAP** - Web application security scanner
2. **Burp Suite** - Security testing platform
3. **npm audit** - Dependency vulnerability scanner
4. **Snyk** - Open source security platform
5. **SonarQube** - Code quality and security

## Incident Response

### Security Incident Process

1. **Detection**
   - Automated alerts
   - User reports
   - Security researchers

2. **Assessment**
   - Severity classification
   - Impact analysis
   - Exploit verification

3. **Containment**
   - Patch development
   - Temporary mitigations
   - Communication plan

4. **Resolution**
   - Deploy fixes
   - Update documentation
   - Publish security advisory

5. **Post-Mortem**
   - Root cause analysis
   - Process improvements
   - Prevention measures

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Remote code execution, data breach | 24-48 hours |
| **High** | Privilege escalation, authentication bypass | 1-2 weeks |
| **Medium** | XSS, CSRF, DoS | 2-4 weeks |
| **Low** | Information disclosure, minor issues | Next release |

## Security Contacts

- **Email**: navidrezadoost07@gmail.com
- **Response Time**: 48 hours
- **PGP Key**: Available upon request

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

*No vulnerabilities reported yet*

---

**Last Updated**: December 10, 2025
**Next Review**: January 10, 2026
