# PROJECT_HANDOFF — Nexus Digital Bridge

Ultimo checkpoint: 2026-09-26 (sessione devin, migrazione self-host completata nel codice, deploy non ancora fatto)

## Dove siamo

- **Migrazione Firebase → self-hosted completata a livello codice** su branch
  `feat/selfhost-backend` (commit `ca83d1c`+). Build Next verde: 54 route,
  typecheck pulito, zero import Firebase/Genkit/Resend/Sentry.
- Live pubblica ancora su stack Firebase congelato (`main`, container
  `nexus-digital-bridge` :8812). **Cutover non ancora eseguito.**
- Sul server: Postgres `nexus_bridge` creato (utente `nexus`, pg_hba aggiornato
  per `172.17.0.0/16`), schema applicato da `drizzle/0000_init_selfhost.sql`.
- `.env` server scritto in `/root/projects/nexus-digital-bridge/.env`
  (chmod 600): DATABASE_URL, BETTER_AUTH_SECRET/URL, SMTP, LLM, UPLOAD_DIR.
- Container di test `nexus-test` su :8813 con volume `nexus-uploads` (non
  tocca la produzione).

## Smoke test E2E già verificati (container :8813)

- Registrazione company/institute → Pending ✅
- Promozione Admin via SQL ✅, login Better Auth con cookie ✅
- `/api/admin/seed` → 13 settori + 31 tipologie ✅
- CV manuale → match bidirezionale 90% (company vede `instituteName`,
  institute vede `interestedCompanies`) ✅
- Chat: azienda→istituto ✅; istituto→azienda con match → dedup ✅;
  istituto→azienda senza match → **403** ✅; estraneo su messaggi → **403** ✅
- Upload PDF → `pdf_path` salvato su volume; download `/api/cv/[id]/pdf` ✅
  - policy: istituto solo i propri (403 altrui), company/admin 200
- **Parsing AI E2E verificato**: `pdftotext` (poppler in Docker) estrae testo,
  LLM OVH Kepler (`LLM_BASE_URL=https://oai.endpoints.kepler.ai.cloud.ovh.net/v1`,
  model `gpt-oss-120b`, key da `/root/shared/chatmate.env`) → nome/classe/
  summary/settori/skills salvati in DB ✅
- CV AI-parsed → match 90% con azienda ("ICT e Digitale"), `chatStarted` ✅
- Notifiche in-app + badge sidebar ✅
- Route pubbliche: `/api/content`, `/api/blog`, `/api/blog/[id]`,
  `/api/stats`, landing, login → tutte 200 ✅
- Admin: `/api/admin/stats|users|chats|blog` (con `coverImage`) → 200 ✅

## Bug risolti in sessione

- `chats.creator_id` aggiunto a schema+migration (era usato ma mancante).
- `/api/admin/demo` DELETE cancellava TUTTI gli utenti non-admin → fix per id `demo-*`.
- `/api/matches` ritorna `{role,matches|students}` → page unwrap corretto.
- `pdf-parse` v2 richiede DOMMatrix/canvas; **1.1.1** falliva con `bad XRef`
  su PDF validi (pdf.js 1.10 vendored) → **sostituito con `pdftotext` (poppler)**
  via `apk add poppler-utils` nel Dockerfile runner; deps rimosse.
- llama-swap locale binda `127.0.0.1:11600` → irraggiungibile dal bridge docker;
  puntato `LLM_BASE_URL` a OVH Kepler (rotta autorizzata chatmate.env).
- `blogPosts.coverImage` non salvato dal POST admin → fix.
- Email Resend (dead code) → `src/server/mail.ts` nodemailer con dominio corretto.
- Nota convenzione: `sector_ids` e `institute_types` si salvano come **nomi**
  (non UUID) in tutto il flusso (register form, CV form, AI output).

## Da fare (prossimi passi)

1. ~~Fix parsing AI~~ — **risolto** con pdftotext + OVH Kepler, E2E verificato.
2. **SMTP/Postfix**: mailer fallisce `ECONNREFUSED 172.17.0.1:25` — host non ha
   SMTP e non esiste sidecar. Dominio ha MX Aruba (mx.nexusdigitalbridge.it).
   Opzioni: (a) postfix container self-contained (deliverability a rischio:
   IP OVH senza PTR/SPF→spam), (b) relay autenticato Aruba smtps.aruba.it:465
   (serve casella + credenziali, deliverability buona), (c) deferire.
   **Decisione bloccante da prendere col Capo.**
3. Deploy: smoke E2E quasi completo su :8813; poi cutover nginx su :8812
   (stop vecchio container Firebase, rename). Prima pulire dati di test.
4. Fase 4 dati: decidere se recuperare export Firestore (serve service account).
5. Fase 5: ChatMate + EmaMonitor + THREAT-MODEL/SLO/GDPR (CV minori).

## Rischi aperti

- Disco server 90% (47G liberi) — attenzione alle immagini docker vecchie.
- Credenziali Firebase admin non nel repo: export dati da coordinare.
- Postfix non configurato: le email falliscono silenziosamente (log only).
- llama-swap :11600 richiede API key (da env autorizzato, mai in git).
