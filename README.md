# Nexus — The Longevity Web

An offline-first, privacy-first biological telemetry visualization and longevity protocol optimization cockpit.

---

## 🛠️ Run & Development Steps

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Express + Vite)
npm run dev

# App runs at: http://localhost:3000
```

---

## 🚀 Build & Production Deployment

```bash
# 1. Typecheck & lint validation
npm run lint

# 2. Production build (Vite + esbuild bundled server)
npm run build

# 3. Start production server
npm start
```

### Static / Netlify Deployment
- Deployment configuration files: `public/_headers` (CSP, HSTS, Permissions-Policy) & `public/_redirects` (SPA fallback).

---

## 🧪 Testing & Validation

```bash
# Validate TypeScript compilation without emitting files
npm run lint

# Compile and verify bundle integrity
npm run build
```

---

## 🛡️ Privacy & Compliance
- **Zero Telemetry Upload**: All video processing and biometric state calculations are executed on the user's local device.
- **Local Vault**: AES-GCM-256 Web Crypto API zero-knowledge encryption.
- **Regulatory Disclaimer**: Nexus Longevity is an informational biological telemetry visualization and optimization tool. It does not provide medical advice, diagnosis, treatment, or cures. Always consult a qualified healthcare professional before beginning any new protocol or exercise program.
