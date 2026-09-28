# GDPR DATA MAP — Nexus Digital Bridge

Bozza per il registro trattamenti (art. 30). Dati di studenti potenzialmente
minori → baseline rafforzata.

## Finalità e base giuridica

Matching scuola↔azienda per PCTO/alternanza/tirocini. Il titolare è l'istituto
per i dati dei propri studenti; Nexus agisce come responsabile/nominato. Da
definire in DPA: l'istituto dichiara di avere base giuridica (consenso famiglia/
studenti maggiorenni o interesse legittimo istruzione-formazione).

## Mappa dati

| Dato | Fonte | Store | Retention proposta | Accesso |
|---|---|---|---|---|
| Email + password (hash) | utente | `user`,`account` | vita account | owner, admin (no pwd) |
| Profilo azienda (nome, settori, contatti) | utente | `companies` | vita account | utenti approvati |
| Profilo istituto | utente | `institutes` | vita account | utenti approvati |
| **CV PDF originale** | istituto | volume `/app/uploads/cv` | **fino a cancellazione istituto o richiesta** | istituto owner; company/admin read |
| Dati estratti CV (nome, classe, skills, summary) | AI parse | `student_cvs` | come CV | come PDF |
| Messaggi chat | utenti | `messages` | vita account | partecipanti, admin audit |
| Log applicativi | sistema | docker logs | 30gg rotazione | admin |
| Sessioni | sistema | `session` | scadenza cookie | — |

## Flussi esterni

| Destinazione | Dati | Motivo | Base |
|---|---|---|---|
| Regolo AI (`api.regolo.ai`, primario) | testo CV | parsing AI | provider italiano, UE |
| OVH Kepler AI (fallback) | testo CV | parsing AI se Regolo down | stesso fornitore IaaS, UE |
| Postfix host → destinatari | nome + email + link | notifiche | necessità contrattuale; SPF+DKIM+DMARC attivi |

Nessun trasferimento extra-UE (Regolo = italiano, OVH = francese). Firebase/GCP eliminato.

## Diritti interessato — stato implementazione

| Diritto | Come | Stato |
|---|---|---|
| Accesso | profilo utente + CV via API | ✅ self-service |
| Rettifica | update profilo / edit CV | ✅ |
| **Cancellazione** | delete CV (route esiste); delete account TODO UI | ⚠️ parziale |
| Portabilità | export JSON — TODO | ❌ |
| Oblio PDF | `DELETE /api/students/[id]` rimuove record + file dal volume | ✅ |

## Da completare prima del cutover

1. ~~Verificare che `DELETE student` cancelli anche il file PDF~~ — ✅ fa entrambi.
2. Endpoint/processo cancellazione account (cascade CV+PDF+messaggi).
3. Retention policy log + upload volume (job o manuale).
4. Banner/privacy page: aggiornare riferimenti Firebase→self-host se presenti.
5. Nomina responsabili + DPA con istituti (fuori scope tecnico — nota per Capo).
