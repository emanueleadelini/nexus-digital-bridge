# SLO — Nexus Digital Bridge

Bozza iniziale. Da confermare con misurazioni reali post-cutover.

## Indicatori (SLI)

| SLI | Target | Misura |
|---|---|---|
| Disponibilità HTTP | ≥ 99.0% mensile | `GET /api/health` → 200 + `db:"up"` |
| Latenza API p95 | < 800ms | route `/api/*` escluso upload/parse |
| Latenza upload+parse p95 | < 60s | LLM-bound, dipende da OVH Kepler |
| Error rate 5xx | < 1% delle richieste | log container |

## Monitoraggio

- Health: `GET /api/health` (JSON `{status, db}`) — da agganciare a EmaMonitor.
- Log: `docker logs nexus-digital-bridge` — errori `[mailer]`, `[students]`,
  `LLM parse failed` sono i pattern da allertare.
- Disco: volume `nexus-uploads` — alert > 80% (server già al 90% globale).

## Dipendenze esterne e impatto

| Dipendenza | Se cade | Impatto |
|---|---|---|
| Postgres host | outage | sito down (health fail) |
| OVH Kepler LLM | outage/degrado | upload PDF senza auto-parse (fallback manuale esiste) |
| SMTP | outage | email non inviate, app continua (non bloccante) |
| nginx host | outage | sito irraggiungibile |

## Recovery

- Restart policy container: `--restart unless-stopped` (da aggiungere al run prod).
- DB: backup Postgres esterno al container (policy da definire, Fase 6).
- Rollback: immagine docker taggata; vecchio container Firebase tenuto spento
  per N giorni post-cutover (rename, non delete).
