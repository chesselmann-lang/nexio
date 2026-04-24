# Nexio — Deployment auf Mittwald mStudio

## Voraussetzungen
- Node.js 20+ auf dem mStudio-App
- PM2 global installiert (`npm i -g pm2`)
- Domain konfiguriert (z.B. nexio.de)
- Supabase Projekt erstellt (EU-Region Frankfurt)

## 1. mStudio App erstellen

Im Mittwald mStudio:
1. Neue Node.js App erstellen
2. Node.js Version: 20.x wählen
3. Startbefehl: `npm start` (PM2 übernimmt das)
4. Port: 3000

## 2. Supabase einrichten

```bash
# Schema einspielen (einmalig)
# In Supabase Dashboard → SQL Editor:
# Inhalt von /supabase/migrations/001_initial_schema.sql einfügen & ausführen

# Phone Auth aktivieren:
# Supabase Dashboard → Authentication → Providers → Phone → Enable
# SMS Provider: Twilio oder Supabase Built-in (Dev-Modus für Tests)
```

## 3. Deployment via SSH

```bash
# SSH zu Mittwald (Git Bash nutzen, nicht Windows OpenSSH)
ssh -i ~/.ssh/mittwald_key [USER]@[SERVER]

# Ins App-Verzeichnis
cd /home/[USER]/html/nexio

# Code deployen
git pull origin main
npm ci --production=false
npm run build

# PM2 starten/neustarten
pm2 start ecosystem.config.js
# oder bei Update:
pm2 reload nexio

# PM2 autostart einrichten
pm2 save
pm2 startup
```

## 4. Environment Variables

```bash
# .env.local auf dem Server anlegen
cp .env.local.example .env.local
nano .env.local
# Werte eintragen, dann speichern
```

## 5. Nginx / Reverse Proxy (mStudio handled das)

mStudio konfiguriert den Reverse Proxy automatisch.
Stelle sicher, dass Port 3000 als App-Port eingetragen ist.

## 6. Supabase Realtime für Chat

Supabase Realtime ist out-of-the-box aktiv.
Die `ALTER PUBLICATION supabase_realtime ADD TABLE` Befehle
sind bereits im Schema enthalten.

## Troubleshooting

**Build schlägt fehl:**
```bash
rm -rf .next && npm run build
```

**Port schon belegt:**
```bash
pm2 delete nexio
pm2 start ecosystem.config.js
```

**Env-Variablen nicht geladen:**
```bash
# Sicherstellen dass .env.local existiert
ls -la .env.local
pm2 reload nexio --update-env
```
