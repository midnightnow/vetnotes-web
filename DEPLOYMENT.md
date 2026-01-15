# VetNotes Deployment Guide

## 🏗️ Architecture Overview

VetNotes runs on a **Two-Project Firebase Architecture**:

| Domain | Firebase Project | Purpose |
|--------|------------------|---------|
| `vetnotes.me` | `vetnotes-mvp` | Free/Sovereign tier – local-first, offline-capable |
| `vetnotes.pro` | `vetnotes-pro` | Premium tier – Revenue Hunter, Cloud LLM, PIMS export |

---

## 🚀 Quick Deploy Commands

```bash
cd vetnotes-web

# Deploy to VetNotes.me (Standard/Free)
npm run deploy:mvp

# Deploy to VetNotes.pro (Premium)
npm run deploy:pro
```

---

## 📦 Build Process

Both commands run:
1. `npm run build` – Vite builds the SvelteKit static site into `./build`
2. `firebase deploy -P <alias> --only hosting` – Pushes to the correct project

---

## 🔧 Configuration Files

### `.firebaserc`
```json
{
  "projects": {
    "mvp": "vetnotes-mvp",
    "pro": "vetnotes-pro"
  }
}
```

### `firebase.json`
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

---

## 🌐 Custom Domains

### VetNotes.me
- Firebase Console: `vetnotes-mvp` → Hosting → Add custom domain
- DNS Records (Cloudflare):
  - `A` record: `vetnotes.me` → `199.36.158.100`
  - `TXT` record: `vetnotes.me` → `hosting-site=vetnotes-mvp`

### VetNotes.pro
- Firebase Console: `vetnotes-pro` → Hosting → Add custom domain
- DNS Records (Cloudflare):
  - `A` record: `vetnotes.pro` → `199.36.158.100`
  - `TXT` record: `vetnotes.pro` → `hosting-site=vetnotes-pro`

---

## 🖥️ Desktop Apps

### Electron
```bash
cd vetnotes-pro
npm run build
npm run electron:start  # Dev mode
npm run electron:build  # Package for distribution
```

### Tauri
```bash
cd vetnotes-pro
npm run tauri dev       # Dev mode
npm run tauri build     # Package native binary
```

---

## 🔐 Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_GEMINI_API_KEY` | `.env` (optional) | Default Gemini key for dev |
| User API Key | `localStorage` (`aiva_api_key`) | User-provided key for Cloud LLM |

---

## 📊 Feature Comparison

| Feature | VetNotes.me | VetNotes.pro |
|---------|-------------|--------------|
| Voice Recording | ✅ | ✅ |
| Web Speech API | ✅ | ✅ |
| PII Redaction | ✅ | ✅ |
| Local AIVA (Rule-based) | ✅ | ✅ |
| Cloud LLM (Gemini) | ❌ | ✅ |
| Revenue Hunter | ❌ | ✅ |
| PIMS Export | ❌ | ✅ |
| Offline Mode | ✅ | ✅ |
| Cloud Sync | ❌ | 🔜 (Roadmap) |

---

## 🐛 Troubleshooting

### "Site not found" after deploy
- Ensure the custom domain DNS has propagated (use `dig vetnotes.pro`)
- Check Firebase Console → Hosting → Domain status

### Build fails with `#` in path
- The project directory contains spaces (`00 Constellation`)
- Use `npm run build` from within the `vetnotes-web` folder directly

### Accessibility warnings during build
- These are non-blocking (a11y hints)
- Fix by adding `aria-label` attributes to icon-only buttons

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 2026-01-15 | Revenue Hunter, Web Speech API, Settings modal |
| 3.0 | 2026-01-14 | PII Redaction, Clinical Templates, Session History |
| 2.0 | 2026-01-13 | Ollama Bunker Mode, Premium UI |
| 1.0 | 2026-01-12 | Initial MVP with Whisper + Gemini |
