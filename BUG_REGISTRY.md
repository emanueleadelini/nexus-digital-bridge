# BUG_REGISTRY - Nexus Digital Bridge

| ID | Data | Stato | Severita | Sintesi | Owner | Evidenza |
|---|---|---|---|---|---|---|
| BUG-0001 | 2026-09-04 | template | TBD | Primo registro creato con bootstrap | ad-next-lab | questo file |
| BUG-0002 | 2026-09-26 | open | media | Email transazionali puntano a `nexus-digital-bridge.web.app` (dominio legacy Firebase); dopo re-platforming i link vanno rigenerati sul dominio canonico | ad-next-lab | `src/app/actions/notifications.ts` |
| BUG-0003 | 2026-09-26 | open | alta | `chats.allow list` Firestore espone metadati+lastMessage a ogni utente approvato | ad-next-lab | `firestore.rules`; fix strutturale con Postgres (query lato server) |
| BUG-0004 | 2026-09-26 | open | bassa | Log docker: `Failed to find Server Action` ricorrente — verificare se stale bundle post-deploy | ad-next-lab | `docker logs nexus-digital-bridge` |
| BUG-0005 | 2026-09-26 | open | media | PDF CV mai persistito: resta solo sommario AI | ad-next-lab | decisione Capo 26/09: salvare su storage self-hosted |
| BUG-0006 | 2026-09-26 | open | media | Match visibile solo lato azienda; istituto non vede aziende né % | ad-next-lab | `matches/page.tsx` score fittizio 100 per Institute |
| BUG-0007 | 2026-09-26 | open | media | Vista per-istituto in Search senza % match per CV | ad-next-lab | `search/page.tsx` |
| BUG-0008 | 2026-09-26 | open | media | Nessuna segnalazione proattiva nuovi match | ad-next-lab | nessuna notifications entity |
| BUG-0009 | 2026-09-26 | open | alta | Backend interamente su Firebase (Auth/Firestore/Storage/Genkit-Gemini/Resend): decisione Capo 26/09 = self-host completo su OVH | ad-next-lab | migrazione `feat/selfhost-backend` |
