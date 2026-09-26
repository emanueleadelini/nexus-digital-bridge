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
- **Parsing AI E2E verificato**: `pdftotext` (poppler in Docker) estrae testo;
  LLM **primario Regolo AI** (`LLM_BASE_URL=https://api.regolo.ai/v1`,
  model `glm5.2` — Italia; chiave da `ad-next-cantiere-suite/.env.local`
  var `OVH_AI_API_KEY`), **fallback OVH Kepler** (`gpt-oss-120b`, chatmate.env)
  → nome/classe/summary/settori/skills salvati in DB ✅
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
  usato **Regolo AI glm5.2** primario (decisione Capo: tutto in Italia) +
  OVH Kepler fallback nel codice (`callLLM` con retry).
- SMTP risolto: **postfix già installato sull'host**, attivato e autorizzata
  subnet docker `172.16.0.0/12` in `mynetworks`; invio reale verificato
  (mail.log: accept). Fix formato MAIL_FROM (display name tra virgolette).
- `blogPosts.coverImage` non salvato dal POST admin → fix.
- Email Resend (dead code) → `src/server/mail.ts` nodemailer con dominio corretto.
- Nota convenzione: `sector_ids` e `institute_types` si salvano come **nomi**
  (non UUID) in tutto il flusso (register form, CV form, AI output).

## Da fare (prossimi passi)

1. ~~Fix parsing AI~~ — **risolto** (pdftotext + Regolo glm5.2 + fallback Kepler).
2. ~~SMTP~~ — **risolto**: postfix host attivo, subnet docker autorizzata, invio ok.
   Resta caveat deliverability (IP OVH senza PTR/SPF → possibile spam; da
   verificare con casella reale, eventuale Aruba relay dopo).
3. **Migrazione dati Firestore**: script `scripts/migrate-firestore.js` pronto
   (dry-run + apply, uid Firebase → id Postgres, password non migrabili → reset).
   **Serve service account JSON** — non presente sul server, richiesto al Capo.
4. Deploy: pulire dati di test, cutover nginx su :8812 (stop/rename vecchio
   container Firebase), smoke E2E finale.
5. Fase 5: ChatMate + EmaMonitor. THREAT-MODEL/SLO/GDPR bozze in `ops/`.

## Rischi aperti

- Disco server 90% (47G liberi) — attenzione alle immagini docker vecchie.
- Credenziali Firebase admin non nel repo: export dati da coordinare.
- Postfix non configurato: le email falliscono silenziosamente (log only).
- llama-swap :11600 richiede API key (da env autorizzato, mai in git).
