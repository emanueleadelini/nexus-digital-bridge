# THREAT MODEL — Nexus Digital Bridge

Scope: piattaforma self-hosted OVH (Next.js + Postgres + Better Auth + volume PDF).
Dati sensibili: CV di studenti (potenzialmente minori), profili aziende/istituti,
messaggi chat. Minacce valutate con metodo STRIDE-lite.

## Asset

| Asset | Sensibilità | Dove |
|---|---|---|
| CV PDF originali | ALTA (minori) | volume `nexus-uploads` `/app/uploads/cv` |
| Dati studenti estratti | ALTA | Postgres `student_cvs` |
| Credenziali utenti | ALTA | Postgres `account` (hash Better Auth) |
| Sessioni | MEDIA | Postgres `session` |
| Messaggi chat | MEDIA | Postgres `messages` |
| Profili org | MEDIA | `companies`, `institutes` |

## Minacce e controlli

### Spoofing / accesso non autorizzato

- Registrazione aperta ma stato `Pending`: nessun accesso ai dati prima
  dell'approvazione admin (`requireUser` default Approved). ✅
- Better Auth: password hash (scrypt), cookie httpOnly session DB-backed. ✅
- Gerarchia ruoli: `SuperAdmin` (solo Capo, non modificabile via API) >
  `Admin` (reti aziende/scuole) > `Company`/`Institute`. Promozione/revoca
  Admin SOLO via `PATCH /api/admin/users/:id` da SuperAdmin, con ripristino
  `previous_role`. ✅
- TODO: rate limit su login/register (attualmente assente — rischio brute force).
  Mitigazione futura: middleware rate-limit o nginx `limit_req_zone`.

### Tampering / escalation

- Update profilo: solo il proprio record (id dalla sessione). ✅
- CV update/delete: solo `instituteId === user.id`. ✅
- Admin endpoints: `requireUser({role:"Admin"})` server-side (accetta Admin e
  SuperAdmin via `isAdminRole`). ✅
- Cambio stato utente (approve/reject): Admin/SuperAdmin; cambio ruolo Admin:
  solo SuperAdmin. ✅

### Information disclosure

- PDF download `/api/cv/[id]/pdf`: istituto solo propri CV; company/admin leggono
  per valutazione matching. **Nota**: ogni azienda approvata può leggere TUTTI i
  CV di tutti gli istituti — decisione prodotto consapevole per il matching, da
  rivalutare con GDPR (minori → valutare pseudonimizzazione nome fino al match).
- Chat: solo partecipanti + admin read. `creator_id` tracciato. ✅
- `GET /api/students`: istituto vede solo i propri; company vede tutto il bacino
  (richiesto per matching) o per-institute via search.
- Nessun PII nei log: errori loggati con messaggio, non payload. ✅
- PDF su filesystem fuori da webroot; serviti solo via endpoint autorizzato. ✅

### Injection / XSS

- Drizzle ORM con query parametrizzate → SQL injection mitigata. ✅
- Input sanitizzati (`sanitize` rimuove `<>"'`\``) su campi testo. ⚠️ XSS: React
  escapea di default; `dangerouslySetInnerHTML` da verificare nei blog render.
- Upload: solo PDF, max 10MB, extension check + MIME check. ⚠️ TODO: magic-bytes
  check (`%PDF-` header) — ora accetta qualunque file rinominato .pdf.

### Denial of service

- Upload limitato a 10MB/file. Body parser Next default limits. ✅
- pdftotext eseguito con maxBuffer 8MB; `AbortSignal.timeout(60s)` su LLM. ✅
- TODO: rate limiting generale assente — un utente autenticato può fare N upload.
  Mitigazione: nginx limit_req prima del cutover.

### Repudiation

- `createdAt` su tutte le entità; `creator_id` su chat; admin azioni loggate
  nei log container (docker logs). Audit log strutturato: TODO roadmap.

## Rischio residuo principale

1. **CV di minori leggibili da ogni azienda approvata**: mitigato solo
   dall'approvazione manuale admin. Raccomandato: registrazione azienda richieda
   P.IVA verificabile + log accessi PDF (`cv_views` audit table — roadmap).
2. **Nessun rate limit**: da aggiungere (nginx `limit_req` o middleware).
3. **SMTP**: postfix host + OpenDKIM attivi (firma `d=nexusdigitalbridge.it
   s=mail`); SPF/DKIM/DMARC pubblicati su Aruba 26/09. Contenuto mail: solo
   link/nomi, no dati sensibili. OK.

## Superfici escluse

- LLM esterno: il testo CV esce verso **Regolo AI** (api.regolo.ai, provider
  italiano) primario e **OVH Kepler** come fallback — entrambi UE, rotta
  autorizzata dal Capo. Documentare nel data-map GDPR.
- Nessun dato di pagamento, nessuna integrazione terze parti attiva.
- Firebase/GCP: dismesso dal runtime (dati migrati in Postgres locale 26/09).
