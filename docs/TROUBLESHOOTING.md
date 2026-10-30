# Troubleshooting & Disaster Recovery Manual

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Document Type** | Diagnostic Playbook & Incident Recovery Procedures |
| **Audience** | Full-Stack Engineers, DevOps Engineers, Support Staff |
| **Status** | Approved Troubleshooting Reference |

---

## 1. Quick-Diagnosis Decision Matrix

| Symptom / Error Message | Probable Root Cause | Immediate Action |
| :--- | :--- | :--- |
| `Missing closing " quote at line X` | Raw unescaped double quotes or unquoted newlines in YAML frontmatter. | Run `node scripts/fix-and-validate-content.cjs` |
| `[astro] Could not parse frontmatter in src/content/posts/...` | Illegal characters, unquoted special characters (`:`, `#`), or bad indentation. | Inspect file frontmatter using `npm run validate` |
| `TS2353: Object literal may only specify known properties` | Incompatible typing in third-party library options (e.g., `js-yaml` dump options). | Cast options object using `as any` |
| `GitHub API Error 401 / 403 Forbidden` | Expired `GITHUB_PAT` or missing `repo` scope permissions. | Verify token permissions in GitHub Settings |
| `Cannot read properties of undefined (reading 'prepare')` | D1 database binding `DB` not attached to Cloudflare Pages Functions. | Add `DB` binding under Pages Settings > Functions |
| `Account Locked: Too many failed login attempts` | 5 consecutive invalid passwords triggered 15-minute brute-force lockout. | Wait 15 minutes or execute SQL reset in D1 |
| `Node.js 22 LTS Maintenance warning in Cloudflare build` | Cloudflare Pages default node-build version info notice. | Informational only; build continues normally |

---

## 2. Issue 1: YAML Frontmatter Parsing Failures

### 2.1 Symptoms
Running `npm run build` halts with an error similar to:
```text
[astro] Could not parse frontmatter in src/content/posts/my-article.md:
Missing closing " quote at line 11, column 37:
excerpt: "Title of your new story...
```

### 2.2 Root Cause
A user copied text into the excerpt or meta description field containing:
1. Double quotes (`"`) inside an already double-quoted string.
2. Raw multiline breaks (`\r\n`).
3. An unescaped Markdown image tag (`![alt](url)`).

### 2.3 Step-by-Step Resolution
1. Run the automated content sanitizer script:
   ```bash
   node scripts/fix-and-validate-content.cjs
   ```
2. The script identifies the corrupted line, strips illegal newlines, escapes inner quotes, and rewrites the file safely.
3. Re-run validation:
   ```bash
   npm run validate
   ```
4. Verify build succeeds:
   ```bash
   npm run build
   ```

---

## 3. Issue 2: TypeScript Compiler Errors (`TS2353` in Gutenberg Editor)

### 3.1 Symptoms
Running `npm run lint` or `npx tsc --noEmit` fails with:
```text
src/components/admin/GutenbergEditor.tsx:124:9 - error TS2353: Object literal may only specify known properties, and 'quotingType' does not exist in type 'DumpOptions'.
```

### 3.2 Root Cause
The `@types/js-yaml` type definition sometimes lags behind `js-yaml` runtime support for specific formatting flags like `quotingType`.

### 3.3 Resolution
Cast the options object as `any` in `GutenbergEditor.tsx`:
```typescript
const yamlString = yaml.dump(frontmatterData, {
  lineWidth: -1,
  noRefs: true,
  sortKeys: false,
  quotingType: '"'
} as any);
```
Verify with `npm run lint`.

---

## 4. Issue 3: GitHub Proxy API Errors (401 / 403 / 404)

### 4.1 Symptoms
Pushing changes from `/wpadmin/` produces:
```json
{ "error": "GitHub API responded with status 401: Bad credentials" }
```

### 4.2 Diagnostic Checklist
1. **Token Expiration**: Log in to GitHub > Settings > Developer settings > Personal access tokens. Check if `AstroPress-Production-CMS` has expired.
2. **Missing Scopes**: Ensure the token has the `repo` scope checked. If the repository is in an organization, verify that the organization has authorized SAML or Third-Party Access.
3. **Variable Mapping**: Ensure `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` match the target repository exactly (case-sensitive).
4. **Target Branch**: Confirm that `GITHUB_BRANCH` matches the repository default branch (e.g., `main`).

---

## 5. Issue 4: Dev Server Port Collision (`EADDRINUSE`)

### 5.1 Symptoms
Starting the dev server gives:
```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

### 5.2 Resolution
Locate and terminate the orphaned process:
```bash
# Locate process on port 3000
lsof -i :3000

# Kill the process by PID
kill -9 <PID>

# Restart dev server
npm run dev
```

---

## 6. Issue 5: Cloudflare Pages D1 Binding Disconnect

### 6.1 Symptoms
Accessing `/api/auth/login` returns HTTP 500:
```text
TypeError: Cannot read properties of undefined (reading 'prepare')
```

### 6.2 Root Cause
The Pages Function environment is missing the `DB` D1 database binding in Cloudflare.

### 6.3 Resolution
1. Open Cloudflare Dashboard > Workers & Pages > Select your Pages project.
2. Navigate to **Settings** > **Functions** > **D1 Database Bindings**.
3. Click **Add binding**:
   - Variable Name: `DB`
   - D1 Database: Select your database (e.g., `astropress-auth-db`).
4. Click **Save** and trigger a re-deployment.

---

## 7. Issue 6: Admin Lockout & Password Recovery

### 7.1 Symptoms
The admin login screen reports:
```text
Account locked due to 5 consecutive failed login attempts. Please wait 15 minutes or use your recovery code.
```

### 7.2 Resolution Options
- **Option A (Wait)**: The lockout expires automatically after 15 minutes.
- **Option B (Emergency Recovery Code)**: Click "Forgot Password / Use Recovery Code", enter the 24-character recovery code generated during initial setup, and set a new password.
- **Option C (Direct D1 Unlock via Wrangler CLI)**:
  ```bash
  npx wrangler d1 execute astropress-auth-db --remote --command="UPDATE admin_users SET failed_attempts = 0, locked_until = 0 WHERE email = 'your-admin@example.com';"
  ```
