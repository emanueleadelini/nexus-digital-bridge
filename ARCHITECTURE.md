# ARCHITECTURE.md

## Overview
[Descrizione architettura del progetto]

## Layer Structure
```
/src
  /app         — UI layer (zero logic, zero Firebase)
  /application — Use cases
  /domain      — Entities, rules
  /repositories — Interfaces IXxxRepository
  /infrastructure
    /firebase   — Firebase implementations
  /services    — External services
```

## Key Entities
- [Entità 1]: [descrizione]

## Data Flow
[Descrivi il flusso principale]

## External Services
- Firebase: [cosa gestisce]
- Stripe: [cosa gestisce]

## Migration Plan (60 giorni)
- [ ] Giorno 30: Verifica repository isolation
- [ ] Giorno 45: Test /infrastructure/postgres/
- [ ] Giorno 60: Switch produzione
