# PROJECT_HANDOFF — Nexus Digital Bridge

Ultimo checkpoint: 2026-09-26 (sessione devin — **CUTOVER ESEGUITO**)

## Dove siamo — STATO: LIVE SU STACK SELF-HOSTED

- **`nexusdigitalbridge.it` serve il nuovo stack** (verificato: HTTPS 200,
  `/api/health` → `db:up`). Container `nexus-digital-bridge` su `127.0.0.1:8812`,
  immagine `nexus-selfhost:prod`, restart `unless-stopped`.
- Vecchio container Firebase **fermato e rinominato `nexus-firebase-legacy`**
  (rollback = `docker rename` + start).
- **Dati migrati da Firestore**: export via REST con OAuth cloud-platform
  (`scripts/export-firestore.js`, usa sessione firebase-tools del PC),
  import via `scripts/import-firestore.js`. Risultato: 8 utenti reali +
  20 stub demo, 13 aziende, 14 istituti, 101 CV, 3 chat, 6 messaggi,
  13 settori, 31 tipologie.
- **Admin `emanueleadelini@gmail.com` è `SuperAdmin`** (gerarchia:
  `SuperAdmin` > `Admin` > `Company`/`Institute`). Solo il SuperAdmin può
  promuovere un Company/Institute ad `Admin` (reti aziende/scuole) o revocarlo:
  `PATCH /api/admin/users/:id {role:"Admin"|"revoke"}` → su revoke ripristina
  `previous_role`. Il SuperAdmin non è modificabile via API né da Admin.
  Verificato in prod: promote demo-institute-9 → Admin → revoke → Institute.
- Test container `nexus-test` su :8813 ancora attivo (stessa immagine).
- **Password utenti migrati NON esistono**: ogni utente reale deve fare
  "password dimenticata" al primo accesso (o admin reset via SQL con
  `/tmp/nexus-migrate/setpw.js`).

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
- **Email RISOLTA 2026-09-26 ~17:05 UTC**: record DNS pubblicati su Aruba via
  pannello web (browser bridge): SPF `@`, DKIM `mail._domainkey`, DMARC `_dmarc`.
  Reset password di test verso Gmail accettato (`status=sent 250 OK` in mail.log).
  opendkim firma `d=nexusdigitalbridge.it s=mail` su porta 8899.
- `blogPosts.coverImage` non salvato dal POST admin → fix.
- Email Resend (dead code) → `src/server/mail.ts` nodemailer con dominio corretto.
- Nota convenzione: `sector_ids` e `institute_types` si salvano come **nomi**
  (non UUID) in tutto il flusso (register form, CV form, AI output).

## Da fare (prossimi passi)

1. ~~DNS Aruba~~ **FATTO**: SPF+DKIM+DMARC pubblicati, mail a Gmail verificata.
   Resta opzionale il PTR reverse su pannello OVH (migliora deliverability).
2. **Password reset utenti migrati**: ora funzionante via email; comunicare agli
   utenti di usare "password dimenticata".
3. **EmaMonitor**: agganciare `/api/health` (SLO in `ops/SLO.md`).
4. Pulizia: rimuovere `nexus-test` :8813 quando non serve più; pruning
   immagini/volumi docker (disco era al 93%, ora ~92% dopo pulizia).
5. Dopo N giorni di stabilità: eliminare `nexus-firebase-legacy`.
6. Threat model/SLO/GDPR bozze in `ops/` — da completare col Capo.

## Rischi aperti

- Disco server 90% (47G liberi) — attenzione alle immagini docker vecchie.
- Credenziali Firebase admin non nel repo: export dati da coordinare.
- ~~Postfix non configurato~~ risolto: postfix+opendkim attivi, DNS pubblicato.
- llama-swap :11600 richiede API key (da env autorizzato, mai in git).
