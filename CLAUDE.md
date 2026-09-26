# Nexus Digital Bridge — Contesto per agenti

## Cos'è
Piattaforma B2B che connette **Istituti scolastici** e **Aziende** italiane.
Gli istituti caricano i CV (PDF Europass) degli studenti; il sistema calcola
match spiegabili azienda↔studente; chat diretta tra le parti.

**Stack:** Next.js 15 (App Router, standalone) + React 19 + Tailwind/shadcn +
PostgreSQL 16 + Drizzle ORM + Better Auth + Nodemailer + pdf-parse +
llama-swap (LLM OpenAI-compatible su OVH). **Tutto self-hosted: niente Firebase,
niente Genkit, niente Resend, niente Sentry.**

## Dove vive
- Repo: `github.com/emanueleadelini/nexus-digital-bridge` (clone server: `/root/projects/nexus-digital-bridge`)
- Produzione: OVH, Docker `nexus-digital-bridge` → `127.0.0.1:8812`, nginx → `nexusdigitalbridge.it`
- DB: Postgres host `nexus_bridge` (utente `nexus`), raggiungibile da container via `172.17.0.1:5432`
- Uploads: volume Docker `nexus-uploads` → `/app/uploads` (PDF CV originali)
- LLM parsing: llama-swap su host `:11600/v1`
- Email: postfix su host `:25` (o sidecar)

## Struttura
```
src/
├── app/                    # pagine (auth, dashboard, admin, pubbliche)
│   ├── api/                # route handlers (tutta la logica server)
│   │   ├── auth/[...all]/  # Better Auth handler
│   │   ├── register, me, profile, sectors, institute-types, stats, content, blog
│   │   ├── students[/parse|/[id]], cv/[id]/pdf, matches, search/institutes,
│   │   ├── chats[/[id]/messages], notifications
│   │   └── admin/          # users, sectors, institute-types, blog, chats, stats, content, seed, demo
├── server/
│   ├── auth.ts             # Better Auth + Drizzle adapter
│   ├── guard.ts            # requireUser (Approved di default, ruolo opzionale)
│   ├── data.ts             # repository: match, chat, notifiche, stats
│   ├── matching.ts         # score deterministico spiegabile (settori+keyword)
│   ├── ai.ts               # extractPdfText (pdf-parse) + parseCVText (llama-swap)
│   ├── mail.ts             # email transazionali via SMTP locale
│   ├── uploads.ts          # storage PDF su volume
│   └── db/                 # client.ts (pg Pool), schema.ts (14 tabelle)
├── lib/api.ts              # useMe, useAuthGuard, useApiData (polling), apiFetch
├── lib/auth-client.ts      # better-auth/react client
└── types/index.ts          # tipi dominio condivisi
```

## Regole architetturali
- **Mai** reintrodurre Firebase/Genkit/Resend/Sentry. Niente dipendenze esterne di dati.
- Tutta la logica dati in `src/server/` + route API. Le pagine usano `apiFetch`/`useApiData`, mai query dirette.
- `requireUser` esige `status === "Approved"` di default (Admin esente).
- Chat: `company → institute` sempre consentita; `institute → company` solo se `instituteHasMatchWith` (match reale su CV). Enforced in `POST /api/chats`, non solo in UI.
- Accesso chat/messaggi: solo partecipanti (companyId/instituteId === user.id) o Admin.
- Matching: deterministico (overlap settori + keyword CV), NON score AI opaco. Sempre spiegabile.
- PDF CV: salvato su volume (`student_cvs.pdf_path`), servito da `/api/cv/[id]/pdf` con auth (istituto = solo propri; aziende/admin = lettura, dati già visibili per design del matching).
- `isDemo` su aziende/istituti/CV: sempre filtrato fuori dalle viste reali.
- Email: solo `src/server/mail.ts` (fire-and-forget, mai bloccare la request).
- Env reali in `.env` (gitignored) — vedi `.env.example`.

## Comandi
`npm ci` · `npm run typecheck` · `npm run lint` · `npm run build`
Migration: `npx drizzle-kit generate` → `drizzle/*.sql` applicato via psql.
Deploy: `docker build -t nexus-selfhost .` → `docker run --env-file .env -p 8812:3000 -v nexus-uploads:/app/uploads`.

## Stato e bug
Vedi `BUG_REGISTRY.md`, `ops/GATE.md`, `docs/PROJECT_HANDOFF.md`.
Admin canonico: `emanueleadelini@gmail.com`.
