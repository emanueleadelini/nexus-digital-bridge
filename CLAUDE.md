# CLAUDE.md — Nexus Digital Bridge

## Progetto
**Nome:** Nexus Digital Bridge  
**Tipo:** B2B SaaS — piattaforma di matching scuole/istituti ↔ aziende italiane  
**Stack:** Next.js 15 + Firebase (Auth + Firestore + App Hosting) + Genkit/Gemini  
**Firebase Project ID:** `studio-2511976075-f03a5`  
**Live URL:** https://studio--studio-2511976075-f03a5.us-central1.hosted.app  
**Dominio:** www.nexusdigitalbridge.it  
**Deploy:** Firebase App Hosting (auto-deploy su push a `main`)

---

## Stack Tecnico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5.9 |
| UI | React | 19.2.1 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS + shadcn/ui | 3.4.1 |
| Icons | Lucide React | 0.475.0 |
| DB & Auth | Firebase (Firestore + Auth) | 11.9.1 |
| AI Orchestration | Genkit + Google Genai Plugin | 1.20.0 |
| AI Model | Gemini 2.5 Flash | via googleai/gemini-2.5-flash |
| Email | Resend | 4.1.2 |
| Forms | react-hook-form + Zod | 7.54.2 / 3.24.2 |
| Charts | Recharts | 2.15.1 |
| Date utils | date-fns | 3.6.0 |
| Dev bundler | Turbopack | (Next.js 15 built-in) |

---

## Architettura Cartelle

```
src/
├── app/                   # Pagine Next.js (ZERO logica Firebase qui)
│   ├── (public)/          # Landing, login, register, blog, privacy, terms
│   ├── admin/             # Dashboard admin (dashboard, users, blog, sectors, chats)
│   ├── dashboard/         # Dashboard utente (profile, matches, chat, search, students)
│   ├── pending-approval/  # Pagina attesa approvazione
│   ├── rejected/          # Pagina rifiuto
│   └── actions/
│       └── notifications.ts  # Server Action: invio email via Resend
├── ai/
│   ├── genkit.ts             # Init Genkit (modello gemini-2.5-flash)
│   └── flows/
│       └── parse-cv-flow.ts  # Flow: PDF Europass → dati strutturati
├── firebase/
│   ├── config.ts             # Config Firebase da env vars
│   ├── provider.tsx          # FirebaseProvider context (Auth + Firestore)
│   └── firestore/
│       ├── use-doc.tsx        # Hook: doc singolo + real-time listener
│       └── use-collection.tsx # Hook: query collection + real-time listener
├── components/
│   ├── ui/                   # 38 componenti shadcn/ui
│   ├── layout/               # Navbar pubblica
│   └── dashboard/            # Sidebar dashboard
├── hooks/
│   ├── use-auth-guard.ts     # Protezione route, redirect, role check
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── constants.ts          # INDUSTRY_SECTORS[], INSTITUTE_TYPES[]
│   └── utils.ts
└── types/
    └── index.ts              # Interfacce TS: UserProfile, CompanyProfile, StudentCV, ChatMessage, MatchResult
```

---

## Firestore Collections

```
users/{userId}              — profilo utente, role ('Admin'|'Company'|'Institute'), status ('Pending'|'Approved'|'Rejected')
companies/{companyId}       — profilo azienda, sectorIds[], vatNumber, isDemo
institutes/{instituteId}    — profilo istituto, sectorIds[], types[]
  └── studentCVs/{cvId}     — CV studenti (subcollection), collectionGroup query abilitata
sectors/{sectorId}          — 13 settori Confindustria (gestiti da Admin)
instituteTypes/{typeId}     — 30+ tipologie istituto (Liceo, ITI, etc.)
blogPosts/{postId}          — post blog, tags[], isDemo
chats/{chatId}              — conversazioni company↔institute
  └── messages/{msgId}      — messaggi (immutabili: no update/delete)
config/{configId}           — configurazione globale (lettura pubblica)
```

---

## Regole Operative

- **Separazione dei layer:** tutta la logica Firebase va in `src/firebase/` o negli hooks — mai nelle pagine `app/`
- **Ruoli:** Admin / Company / Institute — sempre verificare `role` e `status === 'Approved'` prima di mostrare dati sensibili
- **XSS:** sanitizzare sempre gli input name/company/institute prima di scrivere su Firestore
- **Demo data:** `isDemo: true` — mai mostrare nei contesti production; filtrare sempre `where('isDemo', '!=', true)`
- **Matching algorithm:** non modificare la formula in `matches/page.tsx` senza test — score = (sector coverage) * 90 + text bonus (max +10)
- **Chat security:** il Firestore `allow list` è troppo aperto — la sicurezza si basa sul `where()` client-side; non rimuovere mai quel filtro
- **Server Actions:** le email vanno solo via `src/app/actions/notifications.ts` — non chiamare Resend altrove
- **Genkit flows:** usare solo come `"use server"` — non esporre chiavi GOOGLE_GENAI_API_KEY lato client
- **Niente SSG/SSR per dati utente:** tutta la UI è client-side per via dell'auth real-time di Firebase

### Anti-pattern vietati
- Non scrivere logica Firebase direttamente nelle pagine `app/` — usare hooks o provider
- Non usare `console.log` in produzione
- Non committare `.env` con chiavi reali (attualmente un problema aperto)
- Non usare `allow get: if true` su nuove collections che conterranno dati sensibili

---

## File Critici

| File | Perché è critico |
|------|----------------|
| `firestore.rules` | Security rules per tutti i dati — un errore qui espone tutto il DB |
| `firestore.indexes.json` | Indexes per query chat — senza questi le query falliscono |
| `apphosting.yaml` | Secrets Firebase (RESEND_API_KEY, ADMIN_EMAIL, GOOGLE_GENAI_API_KEY) |
| `src/firebase/config.ts` | Config Firebase — deve leggere da env vars, mai hardcoded |
| `src/firebase/provider.tsx` | Context Auth+Firestore — usato da tutta l'app |
| `src/hooks/use-auth-guard.ts` | Protezione route — manomettere questo bypassa il controllo accessi |
| `src/app/actions/notifications.ts` | Server Action email — contiene logica con Resend API |
| `src/ai/flows/parse-cv-flow.ts` | Genkit flow CV parsing — integrazione Gemini |
| `src/app/dashboard/matches/page.tsx` | Algoritmo matching v3.0 — logica core del prodotto |
| `src/app/register/page.tsx` | Registrazione + sanitizzazione XSS |
| `src/app/admin/users/page.tsx` | Approvazione/rifiuto utenti — operazioni su `status` |
| `src/lib/constants.ts` | INDUSTRY_SECTORS e INSTITUTE_TYPES — usati in tutto il codice |
| `src/types/index.ts` | Interfacce TypeScript condivise |

---

## Stato Attuale (aggiornato 2026-04-03)

### Feature Completate ✅
- [x] Autenticazione email/password (Firebase Auth)
- [x] Flusso registrazione Company / Institute / Admin
- [x] Workflow approvazione admin (Pending → Approved/Rejected + email)
- [x] Profili Company e Institute (edit completo)
- [x] Gestione CV studenti con AI parsing (Genkit + Gemini 2.5 Flash)
- [x] Algoritmo matching v3.0 (sector coverage score)
- [x] Chat real-time tra Company e Institute (Firestore)
- [x] Blog system CRUD (admin)
- [x] Gestione Settori e Tipologie Istituto (admin)
- [x] Generazione demo data (admin)
- [x] Email transazionali (Resend): registrazione, approvazione, rifiuto
- [x] Prevenzione XSS (sanitizzazione input)
- [x] Fix user enumeration su forgot-password
- [x] Design mobile-first responsive

### Bug Aperti ⚠️
- [ ] **ALTA PRIORITÀ:** Chat list data leak — `allow list: if isApproved()` troppo permissivo in `firestore.rules`
- [ ] **ALTA PRIORITÀ:** Race condition double-click su "Approva" in `admin/users/page.tsx`
- [ ] **ALTA PRIORITÀ:** Nessun limite dimensione file PDF upload (può uploadare 100MB+)
- [ ] **MEDIA:** Admin chats mostra UID raw invece di nomi azienda/istituto
- [ ] **MEDIA:** `isDemo: true` non filtrato consistently in tutte le pagine
- [ ] **MEDIA:** Search matching non cerca in `cvInformation` (solo settori e nome)
- [ ] **MEDIA:** Blog editor è textarea plain text (no rich text)

### TODO Prioritari 🔴
- [ ] PDF upload: aggiungere check `file.size > 10MB` in `students/page.tsx`
- [ ] Email verification post-registrazione
- [ ] Google SSO (Firebase + NextAuth o Firebase GoogleAuthProvider)
- [ ] Paginazione query Firestore (critica oltre 1000 records)
- [ ] Confirm password in form registrazione

### Roadmap Medium Priority 🟡
- [ ] Notifiche real-time (badge unread su chat)
- [ ] Google Analytics 4
- [ ] Export CSV studenti
- [ ] Filtri avanzati (classe/anno studenti)
- [ ] Bulk approve/reject utenti (admin)
- [ ] Show/hide password toggle nei form

---

## Environment Variables

### Pubbliche (browser — prefisso NEXT_PUBLIC_)
- `NEXT_PUBLIC_FIREBASE_API_KEY` — Firebase Web API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` — Firebase Auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — ID progetto Firebase
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` — Firebase Storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` — FCM Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` — Firebase App ID
- `NEXT_PUBLIC_SUPPORT_EMAIL` — Email supporto (mostrata su pagina rejected)

### Private (server-side — mai esporre al client)
- `RESEND_API_KEY` — Chiave API Resend per email (in Firebase Secret Manager)
- `GOOGLE_GENAI_API_KEY` — Chiave API Google Gemini per Genkit (in Firebase Secret Manager)
- `ADMIN_EMAIL` — Email admin per notifiche nuovi utenti (in Firebase Secret Manager)

> Le variabili private sono gestite in `apphosting.yaml` tramite Firebase Secrets, non in `.env`.

---

## Debito Tecnico

1. **Secrets nel repo** — `.env` contiene chiavi reali committate. Spostarle SOLO in Firebase Secret Manager
2. **No paginazione** — tutte le query caricano tutti i record (critico oltre ~500 utenti)
3. **No error logging** — Sentry non implementato (menzionato in checklist)
4. **No middleware auth** — protezione route solo client-side via `use-auth-guard.ts`
5. **Nessun test** — zero test unitari/integrazione
6. **Nessun rate limiting** — endpoint AI e auth non protetti da rate limit
7. **Admin stats hardcoded** — la dashboard admin mostra numeri demo invece di query reali
