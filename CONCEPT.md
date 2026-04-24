# NEXIO — Das vollständige Produktkonzept
### Die datenschutzkonforme Super-App für Europa
**Version 1.0 — April 2026**

---

## 1. Vision & Mission

**Mission:** Jedem Menschen in Europa die beste Kommunikations- und Alltagsapp geben — ohne Kompromisse bei Datenschutz, ohne Werbung, ohne amerikanische oder chinesische Konzerne.

**Vision:** Nexio wird das, was WeChat für China ist — aber europäisch, offen und vertrauenswürdig. Eine App für alles: Schreiben, Telefonieren, Bezahlen, Behördengänge, Arzttermine, KI-Assistent. Das komplette digitale Leben.

**Der eine Satz:** *"Nexio ist WhatsApp — aber sicher. Und noch viel mehr."*

---

## 2. Das Problem

### Warum die Welt Nexio braucht

| Problem | Status quo | Nexio-Lösung |
|---|---|---|
| WhatsApp gehört Meta | Daten werden für Ads genutzt | DSGVO-nativ, kein Meta, kein Tracking |
| Telegram ist nicht DSGVO-konform | Server in Dubai, kein E2E by default | EU-Server, E2E für alle Nachrichten |
| WeChat ist für Europa geblockt | Chinesische Server, staatlicher Zugriff | Europäische Infrastruktur, Open Encryption |
| Kein europäischer Messenger hat Zahlungen | 3 Apps für Chat, Zahlung, Banking | Nexio Pay: SEPA + Karte in einer App |
| KI ist extern und datenschutzproblematisch | ChatGPT, Gemini = US-Daten | KI direkt in der App, EU-konform |

### Die Wechselbereitschaft ist da
- 78% der Deutschen vertrauen WhatsApp nicht mehr (Bitkom 2025)
- EU Digital Markets Act zwingt Interoperabilität ab 2026
- Signal wächst — zeigt: Nutzer wechseln, wenn der Anlass groß genug ist
- Nexio gibt ihnen einen Grund: *alles besser, nicht nur sicherer*

---

## 3. Positionierung: Datenschutz-First

### Das Kernversprechen
**"Deine Nachrichten. Deine Daten. Dein Europa."**

Nexio ist nicht "auch datenschutzfreundlich". Nexio ist von Grund auf so gebaut:

1. **E2E by default** — Jede Nachricht ist verschlüsselt. Kein Server kann lesen.
2. **EU-Hosting** — Mittwald (Deutschland). DSGVO Art. 13/14 vollständig erfüllt.
3. **Kein Tracking** — Keine Werbe-IDs, keine Pixel, kein A/B-Testing auf Nutzerverhalten.
4. **Transparenz-Report** — Monatlich öffentlich: Welche Anfragen gab es von Behörden?
5. **Open Source Core** — Verschlüsselung und Protokoll sind public. Vertrauen durch Code.
6. **Datensouveränität** — Export aller eigenen Daten in 1 Klick. Löschung: sofort und vollständig.

### Differenzierung auf einen Blick

| | WhatsApp | Telegram | Signal | **Nexio** |
|---|---|---|---|---|
| E2E by default | ✅ | ❌ | ✅ | ✅ |
| EU-Hosting | ❌ | ❌ | ❌ | ✅ |
| DSGVO-nativ | ❌ | ❌ | 🟡 | ✅ |
| Zahlungen | ❌ | 🟡 | ❌ | ✅ |
| KI-Assistent | 🟡 | ❌ | ❌ | ✅ |
| Mini-Apps | ❌ | 🟡 | ❌ | ✅ |
| Stories | ❌ | ✅ | ❌ | ✅ |
| Videocalls | ✅ | ✅ | ✅ | ✅ |
| Open Encryption | ❌ | ❌ | ✅ | ✅ |
| Kein Meta/Google | ❌ | ✅ | ✅ | ✅ |
| Preis | Gratis/Daten | Gratis/Premium | Gratis | Freemium |

---

## 4. Produkt: Feature-Roadmap

### Tier 1 — MVP (diese Woche live)
Was gebaut ist und jetzt deployed wird:

- [x] Phone OTP Login (DE, AT, CH)
- [x] 1:1 Chat + Gruppen-Chat
- [x] Medien: Bilder, Videos, Dateien, Sprachnachrichten
- [x] E2E Verschlüsselung (TweetNaCl)
- [x] Emoji Reaktionen
- [x] Typing Indicators (Supabase Presence)
- [x] Push Notifications (Web Push)
- [x] PWA (installierbar, offline-fähig)
- [x] Stories / Momente
- [x] KI-Assistent (Claude-powered, 6 Personas)
- [x] Smart Reply
- [x] Nachrichten-Suche
- [x] QR-Code für Kontakt-Sharing
- [x] WeChat-style Navigation

### Tier 2 — Sprint 5 & 6 (Woche 2–3)
- [ ] **Videocalls & Audiocalls** — LiveKit (DSGVO-konform, selbstgehostet)
- [ ] **Nexio Pay** — SEPA Direktüberweisung + Stripe Connect
- [ ] **Kanäle** — Öffentliche Broadcast-Kanäle (Telegram-style)
- [ ] **Nachrichten löschen/bearbeiten** — inkl. "Für alle löschen"
- [ ] **Pinned Messages** — Wichtiges im Chat anpinnen
- [ ] **Nachricht weiterleiten** — Mit Quellenangabe
- [ ] **Link-Preview** — URL-Vorschau in Nachrichten
- [ ] **Dunkelmodus** — System-basiert + manuell

### Tier 3 — Sprint 7–9 (Monat 2)
- [ ] **Mini-App Plattform** — iframe-Container, JS Bridge, Payment API
- [ ] **Business-Profil** — Verifiziertes Badge, Öffnungszeiten, Produkte
- [ ] **Business-Inbox** — Multi-Agent, Warteschlange, Übergabe
- [ ] **KI-Nachricht-Zusammenfassung** — "Fasse die letzten 50 Nachrichten zusammen"
- [ ] **KI-Übersetzer** — Jede Nachricht automatisch übersetzen (Tap)
- [ ] **Kontakt-Radar** — Freunde in der Nähe finden (opt-in)
- [ ] **Sticker-Pack-System** — Custom Sticker, GIF-Suche (Tenor API)
- [ ] **Nachricht-Scheduling** — Nachrichten für später planen

### Tier 4 — Sprint 10+ (Monat 3)
- [ ] **Native iOS App** — React Native oder Capacitor
- [ ] **Native Android App** — Google Play Store
- [ ] **Mini-App Marketplace** — Externe Entwickler, Zulassung, Provision
- [ ] **Nexio for Business API** — Webhooks, Bot-Framework, Chatbots
- [ ] **eGovt Integration** — BundID, ePerso, Behörden-Mini-Apps
- [ ] **Gesundheitsakte** — EPA-Integration, e-Rezept
- [ ] **Krypto-Zahlungen** — Bitcoin/ETH als optionaler Layer
- [ ] **Desktop App** — Electron oder Tauri (macOS, Windows, Linux)

---

## 5. KI-Strategie: Der entscheidende Vorteil

WeChat hat keine echte KI. Das ist Nexios Superpower.

### KI-Features im Detail

#### 5.1 Nexio Assistent (in-app)
- 6 Personas: Generalist, Rechtsberater, Arzt/Gesundheit, Finanzberater, Übersetzer, Coach
- Streams Antworten (kein Warten)
- Gesprächsverlauf persistent
- Datenschutz: Anfragen laufen über eigene Edge Functions, nie direkt an Anthropic mit Nutzerdaten

#### 5.2 Smart Reply
- Kontextbasierte Antwortvorschläge (3 Chips nach jeder Nachricht)
- Lernt Tonalität aus dem Gesprächsverlauf
- Claude Haiku (schnell, kosteneffizient)

#### 5.3 Nachrichtenübersetzung
- Tap auf jede Nachricht → sofort übersetzen
- Caching in DB (kein doppelter API-Call)
- 40+ Sprachen (alle Claude-Sprachen)

#### 5.4 Chat-Zusammenfassung
- "Fasse die letzten 100 Nachrichten zusammen" — 1 Tap
- Ideal für große Gruppen nach Urlaub
- "Was habe ich verpasst?" — KI durchsucht und fasst zusammen

#### 5.5 KI-Draft-Assistent (Sprint 6)
- Schreibe eine Nachricht, KI macht sie professioneller / freundlicher / kürzer
- 3 Varianten zur Auswahl
- Für Business besonders wertvoll

#### 5.6 Bild-KI (Sprint 7)
- Bilder direkt aus dem Chat generieren (Flux / DALL-E 3)
- Bild-Analyse: "Was ist auf diesem Foto?"
- Dokument-Analyse: PDF hochladen, KI beantwortet Fragen dazu

---

## 6. Monetarisierung

### Modell: Freemium + B2B + Payment-Fee

Das Ziel: Nexio ist für normale Nutzer **immer kostenlos**. Geld kommt aus Premium-Nutzern und Unternehmen.

#### Tier 1: Nexio Free (kostenlos, immer)
- Unbegrenzte Chats und Gruppen
- Calls (Audio + Video)
- Stories, Zahlungen unter 500€/Monat
- KI-Assistent: 50 Nachrichten/Monat
- 2 GB Medien-Storage
- Community Support

#### Tier 2: Nexio Pro (4,99€/Monat)
- KI-Assistent: Unbegrenzt
- Zahlungen: unbegrenzt, 0% Fee bis 1.000€/Monat
- 50 GB Storage
- Custom Themes & Chat-Hintergründe
- Nachricht-Scheduling
- Prioritäts-Support (48h Response)

#### Tier 3: Nexio Business (19,99€/Monat je Team)
- Alles aus Pro
- Business-Profil mit Verifizierungs-Badge
- Multi-Agent Inbox (bis zu 5 Agenten)
- CRM-Integration (Webhooks)
- Chatbot-Builder (No-Code)
- Analytics Dashboard
- API-Zugang (5.000 API-Calls/Monat)
- SLA: 4h Response, 99,9% Uptime

#### Nexio Pay Fees
- Senden unter 10€: kostenlos
- Senden 10–500€: 0% (gefördert durch Pro-Abo)
- Über 500€ ohne Pro: 0,5% (max 10€)
- Internationale Überweisungen: 0,9% + 0,30€

#### Mini-App Provision
- 15% auf In-App-Käufe (weniger als Apple/Google)
- Kostenlose Listing für europäische Entwickler (Beta)
- Verifizierungspauschale: 99€ einmalig (Anti-Spam)

#### Umsatz-Projektion (realistisch)
| Jahr | Nutzer | Pro-Rate | MRR |
|---|---|---|---|
| 2026 | 10.000 | 5% | ~2.500€ |
| 2027 | 100.000 | 8% | ~40.000€ |
| 2028 | 1.000.000 | 10% | ~500.000€ |

---

## 7. Technische Architektur

### Stack-Entscheidungen (und warum)

| Schicht | Technologie | Warum |
|---|---|---|
| Frontend | Next.js 16 + React 19 | SSR, App Router, Edge Functions |
| Styling | Tailwind v4 + CSS Variables | Zero-runtime, dark mode, theming |
| State | Zustand | Leicht, kein Boilerplate |
| Backend | Supabase (PostgreSQL) | Realtime, Auth, Storage, RLS |
| Realtime | Supabase Realtime (WebSockets) | In Supabase inklusive |
| Calls | LiveKit (selbstgehostet EU) | WebRTC, DSGVO-konform, Open Source |
| KI | Anthropic Claude (claude-sonnet-4-6) | Beste Qualität, EU-Datenverarbeitung |
| Payments | Stripe Connect + SEPA | EU-konform, sofort einsatzbereit |
| Crypto | TweetNaCl (Box + SecretBox) | Bewährt, kompakt, Web-kompatibel |
| Hosting | Mittwald mStudio (DE) | Deutsch, DSGVO, günstiger als AWS |
| CDN | Cloudflare | Gratis Tier reicht für MVP |
| Push | Web Push API + VAPID | Standard, kein Firebase nötig |
| PWA | Service Worker + Manifest | Installierbar, offline-fähig |

### Infrastruktur-Diagram

```
User (Browser/PWA/App)
    │
    ├─── Next.js (Mittwald mStudio, Port 3000, PM2)
    │       ├─── App Router (RSC + Client Components)
    │       ├─── API Routes (ai/chat, ai/translate, payments/*)
    │       └─── Edge Functions (Realtime-sensitive)
    │
    ├─── Supabase (eu-central-1)
    │       ├─── PostgreSQL (RLS on all tables)
    │       ├─── Realtime (WebSockets für Chat, Presence)
    │       ├─── Storage (nexio-media, 50MB/file)
    │       └─── Auth (Phone OTP via Twilio)
    │
    ├─── LiveKit (EU-Server, selbstgehostet)
    │       └─── WebRTC Calls (1:1 + Gruppe)
    │
    ├─── Anthropic API
    │       ├─── claude-sonnet-4-6 (Assistent, Zusammenfassung)
    │       └─── claude-haiku-4-5 (Smart Reply, Übersetzung)
    │
    └─── Stripe
            ├─── Connect (Business-Konten)
            └─── Payment Intents (Nexio Pay)
```

### Datenbank-Schema (Übersicht)

| Tabelle | Beschreibung |
|---|---|
| `users` | Profile, E2E-Public-Key, Status, Privatsphäre |
| `conversations` | 1:1, Gruppe, Kanal, Mini-App |
| `conversation_members` | Mitglieder, Rollen, last_read |
| `messages` | Text, Medien, Reaktionen, KI-Vorschläge |
| `contacts` | Adressbuch, Blockierungen |
| `payments` | Nexio Pay Transaktionen (Stripe) |
| `stories` | WeChat Moments, 24h Ablauf |
| `story_comments` | Kommentare auf Stories |
| `push_subscriptions` | Web Push Endpoints |
| `ai_sessions` | KI-Gesprächsverläufe |
| `ai_messages` | KI-Nachrichten |
| `message_translations` | Übersetzungs-Cache |
| `mini_apps` | App-Katalog |
| `channels` | Öffentliche Broadcast-Kanäle |

---

## 8. Security & DSGVO

### Technische Sicherheit
- **E2E Verschlüsselung:** TweetNaCl Box (asymmetrisch für DMs), SecretBox (symmetrisch für Gruppen)
- **Private Keys:** Niemals den Server — nur im LocalStorage des Nutzers
- **TLS:** Überall HTTPS, HSTS, Certificate Pinning in Native App
- **RLS:** Alle DB-Tabellen haben Row Level Security — der Server kann nur lesen, was der Nutzer darf
- **Zero-Knowledge für Inhalte:** Supabase sieht nur Ciphertext
- **SQL-Injection:** Unmöglich durch Supabase Parameterized Queries
- **XSS:** Next.js + CSP Headers

### DSGVO-Compliance
- **Art. 13/14:** Vollständige Datenschutzerklärung bei Registrierung
- **Art. 7:** Einwilligung dokumentiert mit Timestamp (`gdpr_consented_at`)
- **Art. 17:** Löschrecht — Account-Löschung löscht alle Daten (CASCADE)
- **Art. 20:** Datenportabilität — Export-Funktion (JSON)
- **Art. 25:** Privacy by Design — E2E default, minimale Datenerhebung
- **Art. 35:** DSFA für Zahlungsverarbeitung durchführen vor Go-Live
- **Auftragsverarbeitung:** AVV mit Supabase, Stripe, Anthropic, Mittwald

### Transparenz-Versprechen
- Kein Tracking
- Keine Werbung jemals
- Monatlicher Transparenzbericht (behördliche Anfragen)
- Security-Bug-Bounty ab 1.000 Nutzern

---

## 9. Go-to-Market — MVP diese Woche

### Woche 1: Technischer Launch
- [ ] Supabase Phone Auth aktivieren (Twilio)
- [ ] Domain nexio.app (oder nexio.de) registrieren
- [ ] Mittwald mStudio Deploy (PM2, Port 3000)
- [ ] Cloudflare DNS + SSL
- [ ] `npm install && npm run build && pm2 start`
- [ ] Icons generieren (`npm run icons`)
- [ ] PWA testen (Lighthouse Score > 90)
- [ ] Datenschutzerklärung + Impressum live

### Woche 2: Erste Nutzer
- [ ] 10 Beta-Nutzer einladen (persönliches Netzwerk)
- [ ] Feedback sammeln (Typeform)
- [ ] Kritische Bugs fixen
- [ ] Calls bauen (LiveKit)

### Woche 3–4: Wachstum
- [ ] Product Hunt Launch
- [ ] Hacker News "Show HN"
- [ ] Reddit: r/de, r/privacy, r/datenschutz
- [ ] Pressemitteilung an Heise, c't, t3n, Golem

### Langfristig
- SEO: "WhatsApp Alternative Deutschland", "DSGVO Messenger"
- Partnerships: Datenschutzorganisationen (digitalcourage.de)
- B2B: Direkte Ansprache von Anwaltskanzleien, Arztpraxen, Steuerberatern
- Ambassador-Programm: Erste 1.000 Nutzer bekommen "Founding Member" Badge

---

## 10. Calls-Strategie (Sprint 5 — höchste Priorität)

**Ohne Calls ist Nexio kein WhatsApp-Ersatz.** Das ist die kritischste fehlende Funktion.

### Technologie: LiveKit

- Open Source WebRTC-Server
- Selbst hostbar (Mittwald oder Hetzner)
- DSGVO-konform (kein Drittland-Transfer)
- Supports: Audio, Video, Screen Share, Gruppen-Calls
- Next.js SDK verfügbar

### Implementierungsplan

```
1. LiveKit Server: Hetzner Cloud (1 CX21, 5€/Monat reicht für Beta)
2. TURN/STUN: Coturn (kostenlos)
3. LiveKit SDK: npm install @livekit/components-react livekit-client
4. Supabase Edge Function: Token-Generation für LiveKit Rooms
5. Call UI: Minimalistisch — Kamera, Mikro, Auflegen, Switch Camera
6. Signaling: Supabase Realtime (eingehende Call-Benachrichtigung)
```

---

## 11. Nexio Pay — Strategie (Sprint 6)

### Warum Payments der Schlüssel ist
WeChat Pay ist der Grund, warum WeChat in China alternativlos ist. Wer erst bezahlt, verlässt die App nie mehr.

### Implementierung

```
1. Stripe Connect: Jeder Nexio-Nutzer hat ein "Express Account"
2. SEPA Debit: Für DE/EU — keine Kreditkarte nötig
3. Instant Transfer: Peer-to-Peer innerhalb von Nexio (sofort)
4. Externe Überweisungen: Stripe → IBAN (1-2 Werktage)
5. Limits: 500€/Tag kostenlos, dann KYC (Stripe Identity)
```

### UX-Flow (WeChat Pay Inspiration)
```
Chat → "💶 Geld senden" → Betrag eingeben → Bestätigen → Sofort beim Empfänger
Profil → QR-Code → Anderer scannt → Betrag → Senden
```

---

## 12. Mini-App Plattform (Sprint 7)

### Das Konzept

Mini-Apps sind Web-Apps (HTML/JS) die in einem sandboxed iframe in Nexio laufen. Sie haben Zugriff auf:
- Nexio Payment API (mit Nutzer-Genehmigung)
- Nutzer-Profil (Name, Avatar — kein Telefonnummer ohne Einwilligung)
- Kamera (für QR-Scanner, Produktfotos)
- Standort (opt-in)

### Starter-Mini-Apps (wir bauen sie selbst)
1. **Umeldung** — Formular-Assistent für Wohnsitz-Ummeldung
2. **Termin** — Arzt/Friseur buchen (Calendly-Style)
3. **Split-Bill** — Rechnung aufteilen mit Gruppe
4. **Event** — Veranstaltungen erstellen, Tickets verkaufen
5. **Shop** — Einfacher Produkt-Shop mit Nexio Pay

---

## 13. Zusammenfassung: Warum Nexio gewinnt

### Die 5 Gesetze von Nexio

1. **Privatsphäre ist kein Feature — sie ist das Fundament.** Alles ist verschlüsselt. Immer.

2. **KI ist kein Add-on — sie ist integriert.** Smart Reply, Übersetzung, Assistent, Zusammenfassung — nahtlos in jedem Chat.

3. **Europa first.** Hosting, Recht, Sprache, Zahlungen — alles für den europäischen Markt gebaut.

4. **Design ist Respekt.** Keine Dark Patterns, kein Sucht-Design, keine endlosen Feeds. Funktional, schnell, klar.

5. **Offenheit schafft Vertrauen.** Verschlüsselungsprotokoll ist Open Source. Wir zeigen, was der Server sieht: nichts.

---

*Nexio — Deine Nachrichten. Deine Daten. Dein Europa.*
