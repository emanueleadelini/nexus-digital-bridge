# SLO — Nexus Digital Bridge

Stato: live su self-host dal 2026-09-26; baseline da confermare con misurazioni
reali nelle prime settimane di traffico.

## Indicatori (SLI)

| SLI | Target | Misura |
|---|---|---|
| Disponibilità HTTP | ≥ 99.0% mensile | `GET /api/health` → 200 + `db:"up"` |
| Latenza API p95 | < 800ms | route `/api/*` escluso upload/parse |
| Latenza upload+parse p95 | < 60s | LLM-bound (Regolo glm5.2 primario, OVH Kepler fallback) |
| Error rate 5xx | < 1% delle richieste | log container |
| Email transazionali | accettate dal MX destinatario | `status=sent` in `/var/log/mail.log` |

## Monitoraggio

- Health: `GET /api/health` — **agganciato a EmaMonitor** via prober esterno
  `/root/projects/prober-siti-clienti/prober_nexus_digital_bridge.py` (cron
  */5min; controlla anche `/`, `/login`, `/register`, `/api/sectors`;
  `health-red` su RED, recovery automatico ~60min).
- Log: `docker logs nexus-digital-bridge` — pattern da allertare: `[mailer]`,
  `[students]`, `LLM parse failed`.
- Mail: `tail -f /var/log/mail.log` — `status=bounced/deferred` da allertare.
- Disco: volume `nexus-uploads` — alert > 80% (server ~99% globale al 28/09,
  corsia storage in carico al coordinatore).

## Dipendenze esterne e impatto

| Dipendenza | Se cade | Impatto |
|---|---|---|
| Postgres host | outage | sito down (health fail → prober RED) |
| Regolo AI glm5.2 | outage/degrado | fallback automatico OVH Kepler; se cadono entrambi upload PDF senza auto-parse (inserimento manuale esiste) |
| Postfix+OpenDKIM host | outage | email non inviate, app continua (non bloccante) |
| nginx host | outage | sito irraggiungibile (prober RED) |
| Aruba DNS | outage zone | risoluzione dominio e mail degrade |

## Recovery

- Restart policy container: `--restart unless-stopped` (attiva su prod).
- Rollback applicativo: immagine docker taggata `nexus-selfhost:prod`;
  rollback drammatico: container `nexus-firebase-legacy` fermo (da eliminare
  dopo N giorni di stabilità).
- DB: backup Postgres esterno al container (policy da definire con Capo).
