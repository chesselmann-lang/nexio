#!/bin/bash
# ============================================================
# NEXIO — Setup & Deploy Script
# Einmalig ausführen nach dem Klonen / ersten Upload
# ============================================================

set -e

echo "🚀 Nexio Setup..."

# 1. Dependencies installieren
echo "📦 Installiere Abhängigkeiten..."
npm install

# 2. .env.local prüfen
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local fehlt — erstelle aus Vorlage..."
  cp .env.local.example .env.local
  echo "→ Bitte .env.local bearbeiten und Supabase Keys eintragen!"
  echo "→ nano .env.local"
  exit 1
fi

# 3. Build
echo "🔨 Build läuft..."
npm run build

# 4. PM2 starten
echo "🟢 Starte mit PM2..."
if pm2 list | grep -q "nexio"; then
  pm2 reload nexio --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "✅ Nexio läuft! Öffne deine Domain im Browser."
echo "   Logs: pm2 logs nexio"
