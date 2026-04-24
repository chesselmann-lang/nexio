# Nexio — Deploy-Anleitung

## 1. Dependencies installieren

```bash
cd nexio
npm install --legacy-peer-deps
```

## 2. VAPID Keys generieren (Web Push)

```bash
npx web-push generate-vapid-keys
```

Die ausgegebenen Keys in `.env.local` eintragen:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
```

## 3. Icons generieren

```bash
npm install sharp --legacy-peer-deps
npm run icons
```

## 4. Lokaler Test

```bash
npm run type-check   # TypeScript prüfen
npm run lint         # ESLint prüfen
npm run build        # Produktions-Build
npm run dev          # Entwicklungsserver starten
```

---

## 5. GitHub Repository

```bash
git init
git add .
git commit -m "feat: Nexio MVP — WeChat-Alternative für Europa"
```

Dann auf GitHub:
1. Neues Repository anlegen: `nexio` (Private)
2. Remote hinzufügen:

```bash
git remote add origin https://github.com/DEIN_USERNAME/nexio.git
git branch -M main
git push -u origin main
```

---

## 6. Vercel Deployment

### 6a. Vercel-Projekt anlegen

1. https://vercel.com/new aufrufen
2. GitHub-Repo `nexio` importieren
3. Framework: **Next.js** (wird automatisch erkannt)
4. Root Directory: `nexio` (falls im Monorepo, sonst leer lassen)
5. Build Command: `npm run build`
6. Install Command: `npm install --legacy-peer-deps`

### 6b. Umgebungsvariablen in Vercel setzen

In Vercel → Settings → Environment Variables alle Werte aus `.env.local` eintragen:

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cceigsnwrntmvfkghvqb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (aus Supabase Dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | Dein Anthropic API Key |
| `NEXT_PUBLIC_APP_URL` | `https://nexio.app` oder deine Vercel-URL |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Nach Schritt 7 |
| `LIVEKIT_API_KEY` | LiveKit Cloud Dashboard |
| `LIVEKIT_API_SECRET` | LiveKit Cloud Dashboard |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://dein-projekt.livekit.cloud` |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Aus Schritt 2 |
| `VAPID_PRIVATE_KEY` | Aus Schritt 2 |
| `VAPID_SUBJECT` | `mailto:hallo@hesselmann-service.de` |

### 6c. Deploy ausführen

Nach dem Setzen der Env-Vars → **Redeploy** klicken.

---

## 7. Stripe Webhook einrichten

Nach dem ersten Deployment:

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://deine-vercel-url.vercel.app/api/payments/webhook`
3. Events aktivieren:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Webhook Secret (`whsec_...`) → in Vercel als `STRIPE_WEBHOOK_SECRET` eintragen
5. Vercel → **Redeploy**

---

## 8. Supabase Phone Auth (Twilio)

1. Supabase Dashboard → Authentication → Providers → **Phone**
2. Enable Phone provider
3. Twilio auswählen:
   - Account SID: (aus Twilio Console)
   - Auth Token: (aus Twilio Console)
   - Phone Number: (deine Twilio-Nummer)
4. Speichern

---

## 9. LiveKit Cloud einrichten

1. https://cloud.livekit.io → Neues Projekt anlegen
2. API Keys generieren → in Vercel env eintragen
3. URL hat Format: `wss://dein-app.livekit.cloud`

---

## 10. Custom Domain (optional)

In Vercel → Settings → Domains → `nexio.app` hinzufügen
→ DNS-Records bei deinem Domain-Anbieter eintragen wie angegeben.

---

## GitHub Actions CI/CD

Das Repo enthält bereits `.github/workflows/ci.yml`.

GitHub → Settings → Secrets → Actions → folgende Secrets anlegen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LIVEKIT_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

CI läuft bei jedem Push auf `main`/`develop` automatisch.

---

## Supabase Service Role Key finden

Supabase Dashboard → Project → Settings → API → **service_role** (geheim!)

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ NIEMALS in Git committen — nur als Vercel env var setzen!
