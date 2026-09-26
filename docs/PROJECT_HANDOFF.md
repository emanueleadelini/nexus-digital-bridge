# PROJECT_HANDOFF — Nexus Digital Bridge

Ultimo checkpoint: 2026-09-26 (sessione devin, ri-platforming avviato)

## Dove siamo

- Piattaforma live su `nexusdigitalbridge.it`: Next.js standalone in Docker
  `nexus-digital-bridge` (127.0.0.1:8812→3000), nginx+certbot.
- Backend legacy su Firebase (project `studio-2511976075-f03a5`).
- Decisione Capo 2026-09-26: **NO Firebase** → migrazione completa self-host
  OVH: PostgreSQL 16 `nexus_bridge` + Drizzle + Better Auth, PDF su volume,
  parsing CV via llama-swap :11600, email via postfix, Sentry→EmaMonitor.
- Decisions Capo stessa sessione: PDF originale salvato; chat azienda→istituto
  sempre + istituto→azienda solo se match>0; scoring deterministico
  (settori*90+keyword*10), AI solo parsing.

## Branch

- `main` = live Firebase (congelato fino a cutover)
- `feat/selfhost-backend` = riscrittura backend

## Piano in corso (fasi)

0. Knowledge baseline (manuali compilati v0.2.0) ✅ questa sessione
1. Fondamenta: schema Drizzle, Better Auth, seed, pagine auth
2. Migrazione feature: profili/students+PDF/matches/search/chat/admin/pubbliche
3. Feature visione: match bidirezionale, % per-istituto, nome istituto su
   card, badge nuovi match, regole chat
4. Migrazione dati Firestore→Postgres (GAP: serve service account o export)
5. Compliance: ChatMate, EmaMonitor, THREAT-MODEL, SLO, data-map GDPR minori
6. Deploy+cutover+smoke E2E+closeout

## Prossimo passo

Fase 1: schema DB + auth. Vedere `MANUALE_NEXUS_DIGITAL_BRIDGE.md` sez.3.

## Rischi aperti

- Disco server 90% (47G liberi).
- Credenziali Firebase admin non nel repo: export dati da coordinare.
- llama-swap :11600 richiede API key (da env autorizzato, mai in git).
