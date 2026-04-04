# DEPLOY CHECKLIST

## Pre-Deploy Obbligatorio
- [ ] npm run build → nessun errore
- [ ] npm test → tutti passing
- [ ] .env variabili complete
- [ ] Nessun console.log in produzione
- [ ] Sentry configurato e testato
- [ ] Firebase Security Rules verificate
- [ ] Nessuna API key in chiaro

## Deploy Staging
- [ ] Deploy su staging
- [ ] Smoke test manuale
- [ ] Check Sentry (nessun errore nuovo)

## Deploy Production
- [ ] Approvazione CEO
- [ ] Backup dati (se migrazione)
- [ ] Deploy production
- [ ] Monitor Sentry 30 minuti
- [ ] Rollback plan pronto

## Post-Deploy
- [ ] Verifica funzionalità core
- [ ] Check performance
- [ ] Notifica team
