# Nexus Digital Bridge — Manuale Integrale di Sistema (Aggiornato)

## 1. VISIONE E OBIETTIVI
Nexus Digital Bridge è la piattaforma definitiva per colmare il divario tra formazione e mercato del lavoro in Italia.
- **Obiettivo**: Valorizzare il talento degli studenti, permettendo agli Istituti di dare visibilità ai profili e alle Aziende di trovare talenti filtrati per settori merceologici Confindustria reali.
- **Innovazione**: Eliminazione della compilazione manuale tramite Parser IA Europass e Algoritmo di Matching 3.0 (Ibrido Determinista/IA).

## 2. ROADMAP TECNICA E STRATEGICA

### 2.1 Anno 1 — Fondamenta di Produzione
| Feature | Quarter | Stato | Note |
|---------|---------|-------|------|
| Dominio custom + DNS | Q1 | **Completato (Codice)** | Setup Aruba/Firebase richiesto |
| Verifica Resend + email branded | Q1 | **In Corso** | Server Actions attive (Approval/Rejection) |
| Integrazione Stripe (3 tier) | Q2 | Da fare | Fondamentale per il modello SAAS |
| Rate limiting API/Rules | Q2 | **Completato** | Security Rules blindate attive |
| Matching 2.5 (geo + filtri) | Q3 | In corso | Logica settori + keyword IA attiva |
| Modulo PCTO base | Q3-Q4 | Da fare | - |

### 2.2 Anno 2 — Scala e Intelligence
| Feature | Quarter | Stato | Note |
|---------|---------|-------|------|
| **Multi-LLM Engine (Claude Integration)** | Q1 | **In Corso** | Strategia Dual-Agent (Gemini + Claude) |
| Matching 4.0 (Embeddings Vettoriali) | Q1-Q2 | Pianificato | Evoluzione semantica dello score |

## 3. ARCHITETTURA TECNICA (Dual-Agent Development)
La piattaforma è sviluppata utilizzando una strategia **Dual-Agent**:
- **Firebase Studio Prototyper**: Architetto di sistema e gestore dei flussi Firebase/Genkit.
- **Claude Code**: Agente operativo per ottimizzazione sicurezza, debugging profondo e refactoring.

### Stack Tecnologico:
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + Shadcn/UI.
- **Backend**: Firebase (Firestore real-time, Authentication con Security Rules).
- **IA Engine**: Google Genkit (Framework) + Gemini 1.5 Flash (Parsing PDF).
- **Email**: Resend (Server Actions).

## 4. FUNZIONALITÀ CHIAVE IMPLEMENTATE

### A. Parser IA Europass (Tecnologia Genkit)
Il sistema accetta PDF Europass. Gemini 1.5 Flash estrae:
1. Nome, Classe e Hard Skills.
2. Suggerisce i settori Confindustria tramite mapping semantico.
3. **UX**: Loading state progressivo ("Gemini sta analizzando...") per gestire la latenza.

### B. Algoritmo di Matching 3.0 (Hybrid Scoring)
Il Compatibility Score (0-100%) è calcolato su:
- **Settori (90%)**: Intersezione tra settori azienda e settori studente.
- **Bonus IA (10%)**: Scansione del sommario estratto dall'IA per trovare parole chiave correlate ai settori aziendali.

### C. Scheda Talento & Esportazione
- Visualizzazione integrale del profilo studente con layout professionale tipo "Documento".
- Funzione di stampa/PDF ottimizzata via CSS `@media print`.

### D. Sicurezza Firestore (Rules blindate)
Le regole garantiscono:
- **isAdmin()**: Controllo del ruolo 'Admin' direttamente nel documento utente.
- **isApproved()**: Solo utenti approvati possono accedere ai dati sensibili.
- **Chat**: Accesso limitato ai partecipanti o all'admin (Audit Mode).

## 5. MATERIALI DI SUPPORTO
- **Script Video Tutorial Istituti**: Disponibile in `docs/SCRIPT_VIDEO_ISTITUTI.md`.
- **Script Video Tutorial Aziende**: Disponibile in `docs/SCRIPT_VIDEO_AZIENDE.md`.

---
*Nexus Digital Bridge - "Colleghiamo oggi il talento di domani." (Anno 2026)*
