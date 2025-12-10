# Privacy Policy & Data Handling
## Smilodon Component Library

**Version:** 1.0.0  
**Last Updated:** December 7, 2025  
**Effective Date:** December 7, 2025  
**Classification:** Public

---

## Executive Summary

The Smilodon component library is designed with **privacy by default**. We do not collect, store, or transmit any personal information unless explicitly enabled by the application developer with user consent.

**Key Principles:**
- 🔒 **No tracking by default** - Zero telemetry unless opt-in
- 🚫 **No PII collection** - Component never accesses personal data
- ✅ **GDPR/CCPA compliant** - Full transparency and user control
- 🌐 **Local processing** - All data stays in the browser
- 📝 **Full disclosure** - Complete documentation of any data handling

---

## 1. Data We DO NOT Collect

### 1.1 Personal Information

**The component NEVER collects:**
- ❌ Names, email addresses, phone numbers
- ❌ Physical addresses or location data
- ❌ IP addresses or device identifiers
- ❌ Cookies or persistent storage (by default)
- ❌ Biometric data
- ❌ Financial information
- ❌ Health information
- ❌ Government identifiers (SSN, passport, etc.)
- ❌ Authentication credentials
- ❌ User behavior tracking
- ❌ Social media profiles
- ❌ Third-party data linkage

### 1.2 User Content

**The component NEVER stores or transmits:**
- ❌ User selections (what items they choose)
- ❌ Search queries or filter text
- ❌ Form data entered by users
- ❌ Application-specific data
- ❌ Screenshots or recordings

**All user interactions remain local to the browser session.**

---

## 2. Optional Data Collection (Opt-In Only)

### 2.1 Performance Telemetry

**IF** the application developer explicitly enables telemetry **AND** obtains user consent:

```typescript
// Telemetry is DISABLED by default
const select = new NativeSelect({
  telemetry: {
    enabled: false,        // Default: false
    endpoint: '',          // Must be provided
    userConsent: false,    // MUST be true to enable
  }
});
```

**Data Collected (Anonymous Only):**
```typescript
interface TelemetryEvent {
  // Timestamp (not linked to user)
  timestamp: string;              // ISO 8601 format
  
  // Component metadata
  componentVersion: string;       // e.g., "1.0.0"
  frameworkAdapter?: string;      // e.g., "react", "vue" (optional)
  
  // Performance metrics (anonymous)
  renderTime: number;             // milliseconds
  scrollFPS: number;              // frames per second
  memoryUsage: number;            // bytes
  
  // Usage metrics (anonymous)
  itemCount: number;              // Number of items rendered
  selectionCount: number;         // Number of items selected
  
  // Browser environment (minimal)
  browserFamily: string;          // "Chrome", "Firefox", "Safari"
  browserVersion: string;         // Major version only (e.g., "120")
  platform: string;               // "Windows", "macOS", "Linux", "iOS", "Android"
  
  // NO user identifiers
  // NO IP addresses
  // NO user selections
  // NO search queries
  // NO cookies
  // NO device fingerprinting
}
```

### 2.2 Error Reporting (Opt-In)

**IF** enabled by developer **AND** user consent obtained:

```typescript
interface ErrorReport {
  timestamp: string;
  errorType: string;              // Error class name
  errorMessage: string;           // Generic message (no user data)
  componentVersion: string;
  browserFamily: string;
  
  // Stack trace (sanitized - no user data)
  stackTrace: string;             // Paths anonymized
  
  // NO user data in error context
  // NO sensitive application state
}
```

### 2.3 Web Workers

**Data Processing in Web Workers:**

Web Workers are used for performance optimization (search/filter operations). All data processing is **local to the user's browser**.

```typescript
// Data sent to workers
interface WorkerMessage {
  type: 'search' | 'filter' | 'sort';
  items: Array<{
    id: string | number;
    label: string;
    value: any;
  }>;
  query: string;
}

// Workers operate in isolated context
// No network access from workers
// No data leaves the browser
// Workers are terminated when not needed
```

**Security Guarantees:**
- ✅ Workers cannot access DOM
- ✅ Workers cannot access cookies
- ✅ Workers cannot make network requests (unless explicitly coded)
- ✅ Workers are terminated after use
- ✅ All data stays in browser memory

### 2.4 SharedArrayBuffer

**IF** used for performance (currently NOT implemented):

SharedArrayBuffer allows sharing memory between main thread and workers for zero-copy operations.

**Privacy Implications:**
- ⚠️ Requires Cross-Origin Isolation (COOP/COEP headers)
- ✅ All data stays in browser memory
- ✅ No data transmission
- ✅ Cleared on page unload

**Current Status:** NOT USED (future optimization)

---

## 3. GDPR Compliance

### 3.1 Legal Basis

**The component operates under:**
- **Legitimate Interest:** Performance optimization (no PII involved)
- **Consent:** Required for any telemetry (opt-in only)

### 3.2 Data Subject Rights

#### Right to Access (Article 15)
**What we collect:** Nothing by default  
**How to access:** N/A (no data stored)  
**Response time:** Immediate (nothing to provide)

#### Right to Rectification (Article 16)
**Applicability:** N/A (no personal data collected)

#### Right to Erasure ("Right to be Forgotten") (Article 17)
**How to exercise:**
```typescript
// Disable telemetry (if enabled)
select.telemetry.disable();

// Clear any local storage (if used by application)
localStorage.removeItem('native-select-state');
sessionStorage.clear();
```
**Response time:** Immediate (client-side action)

#### Right to Data Portability (Article 20)
**Applicability:** N/A (no personal data collected)

#### Right to Object (Article 21)
**How to exercise:** Telemetry is opt-in only; default is no collection

#### Right to Restrict Processing (Article 18)
**How to exercise:** Disable telemetry or don't enable it

### 3.3 Data Protection Officer (DPO)

**Contact:** privacy@smilodon.dev  
**Role:** Open source project maintainer  
**Responsibilities:** Privacy policy compliance, data handling oversight

---

## 4. CCPA Compliance

### 4.1 California Consumer Privacy Act

**Categories of Personal Information:**
- **Collected:** None by default
- **Sold:** Never (component is free, open source)
- **Shared:** Never (no third parties)

### 4.2 Consumer Rights

#### Right to Know
**What we collect:** Anonymous performance metrics (opt-in only)  
**Purpose:** Library improvement and bug detection  
**Retention:** 90 days maximum

#### Right to Delete
**How to request:** Disable telemetry via API  
**Response time:** Immediate (no server-side storage)

#### Right to Opt-Out of Sale
**Applicability:** N/A (we never sell data)

#### Right to Non-Discrimination
**Guarantee:** Component functions identically with or without telemetry

### 4.3 Do Not Sell My Personal Information

**Status:** Not applicable - we never sell any data.

---

## 5. Other Privacy Regulations

### 5.1 PIPEDA (Canada)

**Compliance:**
- ✅ Consent required (opt-in telemetry)
- ✅ Purpose specification (performance monitoring)
- ✅ Limited collection (minimal anonymous data)
- ✅ Limited use, disclosure, retention
- ✅ Accuracy (not applicable - no personal data)
- ✅ Safeguards (HTTPS, no storage)
- ✅ Openness (this document)
- ✅ Individual access (right to disable)
- ✅ Accountability (maintainer responsible)

### 5.2 UK GDPR

**Post-Brexit compliance:**
- Same as EU GDPR
- ICO (Information Commissioner's Office) guidance followed
- UK data subjects have same rights as EU

### 5.3 Other Jurisdictions

**Brazil (LGPD):** Compliant (no data collection by default)  
**Australia (Privacy Act):** Compliant (no personal information)  
**Japan (APPI):** Compliant (no personal data handling)  
**India (PDPB):** Compliant (minimal data processing)

---

## 6. Data Storage & Retention

### 6.1 Browser Storage (Optional)

**If application uses localStorage/sessionStorage:**

```typescript
// Example: Saving user preferences (application choice)
localStorage.setItem('native-select-theme', 'dark');

// IMPORTANT: Application's responsibility to:
// 1. Obtain user consent (if storing PII)
// 2. Encrypt sensitive data
// 3. Comply with privacy laws
// 4. Provide deletion mechanism
```

**Component Recommendations:**
- ✅ Use sessionStorage for temporary data (cleared on tab close)
- ✅ Use localStorage only for user preferences
- ✅ Never store sensitive data unencrypted
- ✅ Provide clear data deletion option

**Storage Limits:**
```
sessionStorage: ~5-10 MB (per origin)
localStorage: ~5-10 MB (per origin)
IndexedDB: ~50 MB to unlimited (with prompt)
```

### 6.2 Telemetry Retention

**If telemetry enabled:**
- **Active retention:** 90 days
- **Archived retention:** 0 days (no archival)
- **Deletion:** Automatic after 90 days
- **Backup retention:** 0 days (no backups)

**Data Minimization:**
```typescript
// Only store aggregated metrics
interface AggregatedMetrics {
  date: string;                  // Day only (no timestamp)
  avgRenderTime: number;         // Average, not individual
  p95RenderTime: number;         // 95th percentile
  totalEvents: number;           // Count only
  
  // NO individual event data
  // NO user sessions
  // NO timestamps beyond day
}
```

### 6.3 Data Deletion

**Automated Deletion:**
```sql
-- Telemetry database (if used)
DELETE FROM telemetry_events 
WHERE timestamp < NOW() - INTERVAL 90 DAYS;

-- Run daily via cron job
```

**Manual Deletion (User Request):**
```typescript
// Disable telemetry immediately
POST /api/telemetry/opt-out
{
  "sessionId": "abc123",  // Anonymous session ID
  "action": "delete-all"
}

// Response time: Immediate (no data to delete)
```

---

## 7. Cross-Border Data Transfers

### 7.1 Data Locality

**Client-side processing:**
- All data processing occurs in user's browser
- No server-side data transfer (except optional telemetry)
- Data never crosses borders (unless user travels)

**CDN Delivery:**
```
Component code delivered from:
- jsDelivr: Global CDN (700+ locations)
- User downloads from nearest edge location
- No user data sent to CDN
```

### 7.2 Telemetry Data Transfers (If Enabled)

**IF** telemetry enabled, data may be transferred to:
- **Telemetry endpoint:** Specified by application developer
- **Region:** Developer's choice (recommend same region as users)
- **Safeguards:** HTTPS encryption, no PII

**EU-US Data Transfers:**
- Recommend EU hosting for EU users
- Standard Contractual Clauses (SCCs) if needed
- Adequacy decision compliance

---

## 8. Security Measures

### 8.1 Data Protection

**In-Transit Security:**
```
HTTPS/TLS 1.3 (minimum TLS 1.2)
  ↓
Perfect Forward Secrecy (PFS)
  ↓
HSTS (Strict-Transport-Security)
  ↓
Certificate Pinning (recommended)
```

**At-Rest Security:**
- No server-side storage by component
- Browser storage: Application's responsibility
- Recommendation: Web Crypto API for encryption

```typescript
// Example: Encrypting data before localStorage
async function encryptData(
  data: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt data
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  // Return base64 encoded
  return JSON.stringify({
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  });
}
```

### 8.2 Privacy by Design

**Principles:**
1. **Proactive not Reactive:** Privacy built-in from the start
2. **Privacy as Default:** No telemetry unless explicitly enabled
3. **Privacy Embedded:** Part of component design, not add-on
4. **Full Functionality:** Works perfectly without any data collection
5. **End-to-End Security:** Browser to component to application
6. **Visibility & Transparency:** This document, open source code
7. **User-Centric:** User has full control over any data handling

---

## 9. Third-Party Services

### 9.1 CDN Providers

**jsDelivr:**
- **Purpose:** Deliver component code
- **Data shared:** HTTP headers (user agent, IP - transient)
- **Privacy policy:** https://www.jsdelivr.com/privacy-policy-jsdelivr-net
- **Retention:** Access logs retained per their policy
- **Control:** Use npm install instead of CDN to avoid

**unpkg:**
- **Purpose:** Alternative CDN
- **Privacy policy:** https://unpkg.com/
- **Control:** Use npm install instead

**Self-hosting (Recommended for Privacy):**
```bash
npm install @smilodon/core
# Code bundled with your application
# No third-party requests
# Full privacy control
```

### 9.2 NPM Registry

**Purpose:** Package distribution  
**Data shared:** Download count (anonymous)  
**Privacy policy:** https://docs.npmjs.com/policies/privacy  
**Control:** No opt-out (industry standard)

### 9.3 GitHub

**Purpose:** Source code hosting, issue tracking  
**Data shared:** Public contributions (issues, PRs)  
**Privacy policy:** https://docs.github.com/en/github/site-policy/github-privacy-statement  
**Control:** Use pseudonymous account, don't disclose PII

---

## 10. Children's Privacy (COPPA)

### 10.1 Age Restrictions

**Component has no age restrictions.**

However, it does NOT collect personal information from anyone, including children under 13 (USA) or 16 (EU).

**COPPA Compliance:**
- ✅ No personal information collection
- ✅ No behavioral advertising
- ✅ No persistent identifiers (unless application adds)
- ✅ No location data
- ✅ Safe for use in children's applications

**Recommendation for Applications:**
If your application targets children, ensure:
- Parental consent obtained before any data collection
- Child-appropriate privacy notice provided
- COPPA/GDPR Article 8 compliance

---

## 11. Consent Management

### 11.1 Obtaining Consent

**Before enabling telemetry:**

```html
<!-- Example consent banner -->
<div class="consent-banner">
  <p>
    We'd like to collect anonymous performance data to improve 
    @smilodon. This includes render times and browser info.
    <strong>No personal information is collected.</strong>
  </p>
  <button onclick="enableTelemetry()">Accept</button>
  <button onclick="rejectTelemetry()">Decline</button>
  <a href="/privacy-policy">Privacy Policy</a>
</div>

<script>
function enableTelemetry() {
  select.telemetry.enable({
    endpoint: 'https://telemetry.example.com',
    userConsent: true
  });
  localStorage.setItem('telemetry-consent', 'granted');
}

function rejectTelemetry() {
  localStorage.setItem('telemetry-consent', 'denied');
}
</script>
```

### 11.2 Consent Characteristics

**Valid consent must be:**
- ✅ **Freely given:** No penalty for refusing
- ✅ **Specific:** Clear purpose stated
- ✅ **Informed:** Full disclosure provided
- ✅ **Unambiguous:** Explicit action required (opt-in)
- ✅ **Withdrawable:** Can disable anytime

### 11.3 Consent Storage

```typescript
interface ConsentRecord {
  granted: boolean;
  timestamp: string;        // When consent given
  version: string;          // Privacy policy version
  purpose: string;          // "performance-telemetry"
  
  // User can withdraw anytime
  withdrawnAt?: string;
}

// Example
localStorage.setItem('telemetry-consent', JSON.stringify({
  granted: true,
  timestamp: '2025-12-07T12:00:00Z',
  version: '1.0.0',
  purpose: 'performance-telemetry'
}));
```

---

## 12. Data Breach Response

### 12.1 Incident Classification

**Severity Levels:**

| Level | Definition | Notification |
|-------|-----------|--------------|
| **Critical** | PII exposure, mass data breach | Immediate (24h) |
| **High** | Potential PII exposure | 72 hours |
| **Medium** | Anonymous data exposure | 7 days |
| **Low** | Metadata exposure | Next update |

### 12.2 Notification Procedure

**IF** a data breach occurs:

```
1. Detection & Containment (0-4 hours)
   - Identify scope
   - Stop data flow
   - Secure systems
   
2. Assessment (4-24 hours)
   - Determine affected users
   - Classify severity
   - Document incident
   
3. Notification (24-72 hours)
   - Notify affected users
   - Notify authorities (if required)
   - Public disclosure (if appropriate)
   
4. Remediation (ongoing)
   - Fix vulnerability
   - Implement additional safeguards
   - Update privacy policy
   
5. Post-Incident (30 days)
   - Incident report published
   - Process improvements
   - User communication
```

**Notification Channels:**
- Email: navidrezadoost07@gmail.com
- GitHub: Security Advisory
- Website: Incident banner
- Social media: @nativeselect

### 12.3 User Actions

**If you suspect a breach:**
1. Report to security@smilodon.dev
2. Disable telemetry immediately
3. Clear browser storage (if concerned)
4. Monitor for suspicious activity

---

## 13. Privacy Policy Updates

### 13.1 Change Notification

**Material changes will be communicated via:**
- GitHub release notes
- NPM changelog
- Email notification (if contact provided)
- In-component notification (if telemetry enabled)

**Notice period:** 30 days before changes take effect

### 13.2 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-07 | Initial privacy policy |

### 13.3 Acceptance

**By using @smilodon, you acknowledge:**
- You have read this privacy policy
- You understand what data (if any) is collected
- You agree to the terms (especially if enabling telemetry)

**For application developers:**
- You are responsible for user consent
- You must comply with applicable privacy laws
- You must provide your own privacy notice

---

## 14. Contact Information

### 14.1 Privacy Inquiries

**Email:** navidrezadoost07@gmail.com 
**Response time:** 5 business days  
**Languages:** English

**Mailing Address:**
```
@smilodon Privacy Team
[Open Source Project]
[No physical address - distributed team]
```

### 14.2 Data Protection Officer

**Role:** Open source project maintainer  
**Email:** navidrezadoost07@gmail.com 
**Responsibilities:** Privacy policy compliance, data subject requests

### 14.3 Supervisory Authority

**EU Users:**
Contact your local Data Protection Authority:
https://edpb.europa.eu/about-edpb/about-edpb/members_en

**UK Users:**
Information Commissioner's Office (ICO):
https://ico.org.uk/

**California Users:**
California Attorney General:
https://oag.ca.gov/privacy

---

## 15. Transparency Report

### 15.1 Data Requests (Last 12 Months)

| Request Type | Count | Fulfilled |
|-------------|-------|-----------|
| User data access | 0 | N/A |
| User data deletion | 0 | N/A |
| Law enforcement | 0 | N/A |
| Government | 0 | N/A |
| Third-party | 0 | N/A |

**Reason for zero requests:** We don't collect personal data.

### 15.2 Telemetry Statistics

**Total installations (NPM):** [Public metric]  
**Telemetry opt-in rate:** Unknown (we don't track)  
**Average data collected per user:** 0 bytes (default)  
**Data breaches (all time):** 0

---

## 16. Frequently Asked Questions

**Q: Do you sell my data?**  
A: No. We never sell any data. The component is free and open source.

**Q: Do you use cookies?**  
A: No. The component does not set any cookies.

**Q: Do you track my IP address?**  
A: No. The component never accesses or transmits IP addresses.

**Q: What happens to my selections?**  
A: They stay in your browser. We never see them.

**Q: Can I use this in a healthcare/financial application?**  
A: Yes. The component doesn't access PHI or PCI data. However, ensure your application complies with HIPAA/PCI DSS.

**Q: Is this GDPR compliant?**  
A: Yes. No personal data collection by default.

**Q: How do I completely opt out of any data collection?**  
A: Don't enable telemetry. It's disabled by default.

**Q: Can I self-host to ensure privacy?**  
A: Yes. Install via npm and bundle with your application.

**Q: Do Web Workers send data to a server?**  
A: No. Workers operate entirely in your browser.

---

## Appendices

### Appendix A: Data Processing Agreement (DPA)

**For Enterprise Customers:**

If your organization requires a formal DPA, contact us at:
enterprise@smilodon.dev

**Standard terms:**
- Component acts as data processor (if telemetry enabled)
- Your application is data controller
- You are responsible for user consent
- You determine purpose and means of processing

### Appendix B: Subprocessors

**Current subprocessors:** None (no data processing by default)

**IF telemetry enabled:**
- Hosting provider (specified by application developer)
- Your choice determines subprocessors

### Appendix C: Data Inventory

| Data Element | Type | Purpose | Retention | Legal Basis |
|--------------|------|---------|-----------|-------------|
| Render time | Performance | Optimization | 90 days | Legitimate interest |
| Browser version | Technical | Compatibility | 90 days | Legitimate interest |
| Item count | Usage | Statistics | 90 days | Legitimate interest |
| Error messages | Technical | Debugging | 90 days | Legitimate interest |

**Total personal data:** 0 fields

---

**Document Control:**

**Author:** Privacy Team  
**Reviewed by:** Legal Counsel (community)  
**Approved by:** Project Maintainer  
**Next review:** June 7, 2026 (6 months)

**Certification:**  
This privacy policy has been reviewed for compliance with GDPR, CCPA, PIPEDA, and other major privacy regulations.

---

**End of Privacy Policy**
