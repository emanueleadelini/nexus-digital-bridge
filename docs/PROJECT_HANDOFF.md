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
- Notifiche in-app + badge sidebar ✅

## Bug risolti in sessione

- `chats.creator_id` aggiunto a schema+migration (era usato ma mancante).
- `/api/admin/demo` DELETE cancellava TUTTI gli utenti non-admin → fix per id `demo-*`.
- `/api/matches` ritorna `{role,matches|students}` → page unwrap corretto.
- `pdf-parse` v2 richiede DOMMatrix/canvas → downgrade a **1.1.1** + `@types`.
- `blogPosts.coverImage` non salvato dal POST admin → fix.
- Email Resend (dead code) → `src/server/mail.ts` nodemailer con dominio corretto.

## Da fare (prossimi passi)

1. **Fix parsing AI**: pdf-parse 1.1.1 in rebuild — verificare estrazione testo
   + parseCVText con llama-swap reale (env `LLM_API_KEY` già valorizzata).
2. **Postfix**: mailer fallisce `ECONNREFUSED 172.17.0.1:25` — host non ha SMTP.
   Opzioni: postfix container (pattern polouniversitariosantostefano) o host.
3. `/api/blog/[id]` e `/api/content` pubbliche aggiunte — da verificare in smoke.
4. Deploy: rebuild `nexus-selfhost:test` con fix, smoke completo, poi cutover
   nginx su :8812 (stop vecchio container Firebase, rename).
5. Fase 4 dati: decidere se recuperare export Firestore (serve service account).
6. Fase 5: ChatMate + EmaMonitor + THREAT-MODEL/SLO/GDPR (CV minori).

## Rischi aperti

- Disco server 90% (47G liberi) — attenzione alle immagini docker vecchie.
- Credenziali Firebase admin non nel repo: export dati da coordinare.
- Postfix non configurato: le email falliscono silenziosamente (log only).
- llama-swap :11600 richiede API key (da env autorizzato, mai in git).
