# Security Guide: Threat Modeling, Authentication & Edge Hardening

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Security Standard** | OWASP Top 10 Compliance + Zero-Trust Secret Isolation |
| **Audience** | Security Engineers, System Administrators, Compliance Officers |
| **Status** | Approved Production Security Specification |

---

## 1. Threat Model & Attack Surface

The system classifies its attack surface into three distinct functional boundaries:

```text
[ THREAT BOUNDARY 1: PUBLIC INTERNET ]
  - Threats: DDoS attacks, automated content scrapers, comment/form spam.
  - Mitigations: Global Cloudflare WAF, edge caching, zero public databases, no comments enabled by default.

[ THREAT BOUNDARY 2: ADMIN CMS INTERFACE (/wpadmin/) ]
  - Threats: Credential stuffing, brute-force dictionary attacks, session hijacking, CSRF.
  - Mitigations: Rate limiting (5 attempts = 15-min lockout), PBKDF2-SHA256 hashing, HttpOnly SameSite=Lax session cookies.

[ THREAT BOUNDARY 3: GIT PERSISTENCE & API SECRETS ]
  - Threats: GitHub token leakage, YAML code injection, malicious file uploads.
  - Mitigations: Server-side proxy (zero tokens in client), strict Zod schema validation, Canvas WebP conversion, filename sanitization.
```

---

## 2. Authentication Architecture & Password Cryptography

### 2.1 PBKDF2-SHA256 Password Hashing
Passwords are never stored in plaintext or weak hashes (MD5, SHA1). The platform implements salted PBKDF2 using SHA-256:

- **Salt**: 16 cryptographically secure random bytes generated per user via `crypto.getRandomValues()`.
- **Iterations**: 100,000 rounds minimum.
- **Hash Output**: 256-bit derived key encoded in hexadecimal.

```typescript
// Edge Crypto Verification Algorithm
async function verifyPassword(password: string, storedHash: string, storedSaltHex: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const salt = hexToBytes(storedSaltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const computedHash = bytesToHex(new Uint8Array(derivedBits));
  // Constant-time string comparison to prevent timing attacks
  return constantTimeCompare(computedHash, storedHash);
}
```

### 2.2 Brute-Force Rate Limiting & Account Lockouts
To prevent automated credential stuffing:
1. Every failed login attempt increments the `failed_attempts` counter for that user record in `admin_users`.
2. Upon reaching **5 consecutive failed attempts**, the system sets `locked_until = now() + 15 minutes`.
3. Any subsequent login attempts during the lockout window are rejected immediately with HTTP 429 Too Many Requests, regardless of password validity.
4. A successful login resets `failed_attempts` to 0 and clears `locked_until`.

---

## 3. Session Security & Cookie Hardening

Authenticated sessions are managed via secure, cryptographically random session tokens:
- **Token Generation**: 32 bytes of cryptographic randomness generated via `crypto.getRandomValues()` and hex-encoded (64 characters).
- **Storage**: Stored in the `admin_sessions` table with user ID, creation timestamp, IP address, and 7-day expiration timestamp.
- **Cookie Attributes**:
  - `HttpOnly`: Prevents client-side scripts from reading session tokens via JavaScript, neutralizing XSS session theft.
  - `Secure`: Ensures the cookie is only transmitted over encrypted HTTPS connections.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF) on cross-origin requests while permitting top-level navigation.
  - `Path=/`: Restricts cookie scope appropriately.

---

## 4. Zero-Token Architecture: GitHub Proxy Model

A primary security flaw in many client-side CMS implementations is storing GitHub Personal Access Tokens (PAT) in browser `localStorage` or `sessionStorage`. Anyone with access to the browser console can extract the token and compromise the entire GitHub repository.

This platform enforces a **Zero-Token Client Architecture**:

```text
[ Browser Client ]
  - Holds ONLY the HttpOnly session cookie
  - Makes requests ONLY to: POST /api/github/commit
  - ZERO knowledge of GITHUB_PAT
           │
           │ (HTTPS + Session Cookie)
           ▼
[ Cloudflare Pages Edge Function: functions/api/github/[[route]].ts ]
  1. Validates session cookie against `admin_sessions`
  2. Reads GITHUB_PAT from protected environment secret
  3. Executes Git Data API calls directly to api.github.com
  4. Returns commit SHA or sanitized error message
           │
           │ (HTTPS + Bearer GITHUB_PAT)
           ▼
[ GitHub API (api.github.com) ]
```

---

## 5. Input Sanitization & YAML Injection Defense

Because content is converted into YAML frontmatter and Markdown files, arbitrary user input must be sanitized to prevent YAML injection and build compiler crashes.

### 5.1 Frontmatter Sanitization
1. **Multiline Excerpt Stripping**: Excerpts must never contain raw line breaks (`\r\n`), as unquoted line breaks break YAML key-value pairs.
2. **Markdown Image Stripping**: Embedded Markdown images (`![alt](url)`) are stripped from metadata fields to prevent broken JSON-LD and OpenGraph tags.
3. **Strict Quote Escaping**: Internal quotes are escaped, and fields are serialized with `lineWidth: -1` and strict double quotes.

### 5.2 XSS (Cross-Site Scripting) Defense
- Public article rendering escapes raw HTML in Markdown unless explicitly whitelisted in Astro configuration.
- The admin block editor sanitizes rich text HTML inputs, stripping `<script>`, `<iframe>`, `onload`, and `onerror` event attributes before saving.

---

## 6. HTTP Security Headers

The production deployment configures the following security headers in `public/_headers`:

```http
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## 7. Emergency Recovery Codes & Secret Rotation

- **One-Time Recovery Key**: During initial admin setup, an emergency 24-character cryptographic recovery code is generated and hashed with SHA-256. This code bypasses lost passwords to unlock the account.
- **PAT Rotation**: Rotate the `GITHUB_PAT` token annually or immediately if an administrator leaves the organization by updating the secret in Cloudflare Pages settings.
