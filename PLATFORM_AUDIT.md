# NEXUS DIGITAL BRIDGE — AUDIT & ROADMAP
*Documento aggiornato al 24/03/2026 — Da condividere con Claude in sessioni future*

---

## STATO ATTUALE

**Stack:** Next.js 15.5.9 + Firebase (Firestore, Auth, App Hosting)
**URL Live:** https://studio--studio-2511976075-f03a5.us-central1.hosted.app
**Dominio:** www.nexusdigitalbridge.it
**GitHub:** https://github.com/emanueleadelini/nexus-digital-bridge (branch `main`)
**Firebase Project:** `studio-2511976075-f03a5`
**Deploy:** Automatico su push GitHub → Firebase App Hosting

---

## BUG CORRETTI ✅ (24/03/2026)

| # | Bug | File | Stato |
|---|-----|------|-------|
| 1 | XSS: input nome/cognome/ente non sanitizzati | `register/page.tsx` | ✅ Fixato |
| 2 | Algoritmo matching: formula sbagliata (divideva solo per settori azienda) | `dashboard/matches/page.tsx` | ✅ Fixato |
| 3 | Password reset rivelava se email era registrata (user enumeration) | `forgot-password/page.tsx` | ✅ Fixato |
| 4 | Email admin hardcodata `emanueleadelini@gmail.com` in pagina rejected | `rejected/page.tsx` | ✅ Fixato |
| 5 | Blog: tag vuoti salvati quando admin mette virgole extra | `admin/blog/page.tsx` | ✅ Fixato |
| 6 | Blog: delete senza dialog di conferma | `admin/blog/page.tsx` | ✅ Fixato |
| 7 | Settori: stringa vuota accettata come nuovo settore | `admin/sectors/page.tsx` | ✅ Fixato |
| 8 | Settori: duplicati possibili senza controllo | `admin/sectors/page.tsx` | ✅ Fixato |
| 9 | Settori: delete senza dialog di conferma | `admin/sectors/page.tsx` | ✅ Fixato |
| 10 | Tipologie istituti: stessi bug 7/8/9 | `admin/institute-types/page.tsx` | ✅ Fixato |
| 11 | Studenti: delete CV senza dialog di conferma | `dashboard/students/page.tsx` | ✅ Fixato |
| 12 | Blog detail: reading time hardcoded "5 min" | `blog/[id]/page.tsx` | ✅ Fixato |
| 13 | Dialog modale "Scheda Talento" non scrollava | `dashboard/matches/page.tsx` + `ui/dialog.tsx` | ✅ Fixato |
| 14 | apphosting.yaml: maxInstances=1 (bottleneck traffico) | `apphosting.yaml` | ✅ Alzato a 3 |

---

## BUG ANCORA APERTI ⚠️

### Priorità Alta

| # | Bug | File | Descrizione |
|---|-----|------|-------------|
| 1 | Chat list data leak | `firestore.rules` | `allow list: if isApproved()` permette a qualunque utente approvato di listare TUTTE le chat. Le rules non possono filtrare per resource.data in list, quindi la sicurezza si basa interamente sul client che usa `where(companyId == uid)`. Da documentare e monitorare. |
| 2 | Race condition approvazione utente | `admin/users/page.tsx` | Doppio click su "Approva" esegue due updateDoc concorrenti. Il bottone ha già `disabled={updatingId === id}` quindi mitigato, ma non completamente atomico. |
| 3 | File size illimitata upload CV | `dashboard/students/page.tsx` | Nessun limite dimensione PDF. Un utente potrebbe caricare un file da 100MB. Aggiungere check `file.size > 10 * 1024 * 1024` (10MB max). |
| 4 | Pending page: no real-time se admin approva | `pending-approval/page.tsx` | ⚠️ ATTENZIONE: Già ha un `useEffect` con `useDoc` che ascolta il profilo in real-time → redirect automatico su approvazione. Da verificare in produzione se funziona correttamente. |

### Priorità Media

| # | Bug | File | Descrizione |
|---|-----|------|-------------|
| 5 | Search matching cerca solo nome e settori | `dashboard/matches/page.tsx` | Non cerca nel testo del CV (`cvInformation`). Facile da aggiungere. |
| 6 | Admin chats mostra UID grezzi | `admin/chats/page.tsx` | I nomi azienda/istituto non sono risolti, si vedono solo UID Firebase. |
| 7 | Blog admin: editor solo textarea | `admin/blog/page.tsx` | Nessuna formattazione (grassetto, link, ecc.). Testo semplice. |
| 8 | Demo data mischiate con reali | `admin/dashboard/page.tsx` | Il flag `isDemo: true` non è filtrato in tutte le pagine pubbliche. |
| 9 | Config Firestore leggibile da tutti | `firestore.rules` | `allow get: if true` sulla collection config. Se si aggiungono dati sensibili in futuro è un rischio. |

---

## FUNZIONALITÀ MANCANTI — ROADMAP

### 🔴 Priorità Alta (per lancio completo)

#### 1. Google SSO
**Dove:** `login/page.tsx`, `register/page.tsx`
**Come:** Firebase Auth → `signInWithPopup(auth, new GoogleAuthProvider())`
**Impatto:** Riduce attrito registrazione del 60%
**Stima:** 2-3 ore

#### 2. Verifica Email Post-Registrazione
**Dove:** `register/page.tsx` — dopo `createUserWithEmailAndPassword`
**Come:** `sendEmailVerification(user)` già incluso in Firebase Auth
**Impatto:** Evita account fake
**Stima:** 1 ora

#### 3. Limite Upload PDF (10MB)
**Dove:** `dashboard/students/page.tsx` — funzione `handleFileUpload`
**Come:** `if (file.size > 10 * 1024 * 1024) { toast error; return; }`
**Stima:** 15 minuti

#### 4. Ricerca nel Testo CV (Matches)
**Dove:** `dashboard/matches/page.tsx` — funzione `filteredMatches`
**Come:** Aggiungere `|| m.student.cvInformation?.toLowerCase().includes(searchTerm.toLowerCase())`
**Stima:** 10 minuti

#### 5. Conferma Password in Registrazione
**Dove:** `register/page.tsx`
**Come:** Aggiungere campo `confirmPassword` e validare `password === confirmPassword`
**Stima:** 30 minuti

### 🟡 Priorità Media (sprint successivo)

#### 6. Notifiche Real-time
**Cosa:** Badge con numero messaggi non letti nella sidebar
**Come:** Firestore listener su chats dove l'utente è partecipante → conta messaggi con `readBy` non contenente uid
**Stima:** 4-6 ore

#### 7. Toggle Mostra/Nascondi Password
**Dove:** `login/page.tsx`, `register/page.tsx`
**Come:** State `showPassword` + icon Eye/EyeOff su Input
**Stima:** 30 minuti

#### 8. Export CSV Studenti
**Dove:** `dashboard/students/page.tsx`
**Come:** Convertire array `students` in CSV con `papaparse` e download
**Stima:** 1 ora

#### 9. Filter Avanzati Matches (Classe/Anno)
**Dove:** `dashboard/matches/page.tsx`
**Come:** Aggiungere select per filtrare per `student.class`
**Stima:** 1 ora

#### 10. Bulk Approve/Reject Admin
**Dove:** `admin/users/page.tsx`
**Come:** Checkbox per selezione multipla + bottone "Approva selezionati"
**Stima:** 2-3 ore

#### 11. Google Analytics 4
**Dove:** `src/app/layout.tsx`
**Come:** `<Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX" />` + init
**Stima:** 30 minuti

### 🟢 Priorità Bassa (versione 2.0)

- **Mappa Geografica Istituti** — Leaflet.js o Google Maps in `dashboard/search`
- **Upload Logo Azienda/Istituto** — Firebase Storage + immagine profilo
- **Typing Indicator Chat** — Documento Firestore `{isTyping, userId}` aggiornato on keystroke
- **Read Receipts Chat** — Array `readBy: [uid]` nei messaggi
- **Rich Text Editor Blog** — TipTap o React-Quill
- **Dark Mode** — Tailwind `dark:` classes + toggle
- **Testimonianze Homepage** — Sezione statica o da Firestore

---

## PERFORMANCE DA OTTIMIZZARE

| Problema | Impatto | Soluzione |
|---------|---------|-----------|
| Nessuna paginazione (carica tutto) | Alto con 1000+ record | `limit(50)` + paginazione Firestore |
| Nessun caching query Firestore | Ricarica ad ogni navigazione | React Query o SWR |
| collectionGroup('studentCVs') senza index | Può rallentare con molti istituti | Indice Firestore già in `firestore.indexes.json` |

---

## STRUTTURA PAGINE E RUOLI

| Pagina | Ruolo | Stato |
|--------|-------|-------|
| `/` | Pubblica | ✅ |
| `/login` | Pubblica | ✅ |
| `/register` | Pubblica | ✅ XSS fixato |
| `/forgot-password` | Pubblica | ✅ Security fixato |
| `/pending-approval` | Autenticato | ✅ Real-time redirect |
| `/rejected` | Autenticato | ✅ Email fixata |
| `/blog` | Pubblica | ✅ |
| `/blog/[id]` | Pubblica | ✅ Reading time dinamico |
| `/privacy` | Pubblica | ✅ |
| `/terms` | Pubblica | ✅ |
| `/dashboard` | Company/Institute | ✅ |
| `/dashboard/profile` | Company/Institute | ✅ |
| `/dashboard/matches` | Company/Institute | ✅ Algo fixato, modal scroll fixato |
| `/dashboard/chat` | Company/Institute | ✅ |
| `/dashboard/search` | Company/Institute | ⚠️ No filtro ruolo |
| `/dashboard/students` | Institute | ✅ Delete confirm aggiunto |
| `/admin` | Admin | ✅ |
| `/admin/dashboard` | Admin | ⚠️ Demo data mischiate |
| `/admin/users` | Admin | ✅ |
| `/admin/blog` | Admin | ✅ Tag fix, delete confirm |
| `/admin/sectors` | Admin | ✅ Duplicati + validazione + confirm |
| `/admin/institute-types` | Admin | ✅ Duplicati + validazione + confirm |
| `/admin/content` | Admin | ✅ |
| `/admin/chats` | Admin | ⚠️ UID non risolti |

---

## DEPLOYMENT & INFRASTRUTTURA

| Voce | Valore |
|------|--------|
| Framework | Next.js 15.5.9 (Turbopack in dev) |
| Hosting | Firebase App Hosting — backend `studio` |
| Database | Firestore |
| Auth | Firebase Authentication |
| Email | Resend (key in Firebase Secret `RESEND_API_KEY`) |
| AI | Google Gemini via Genkit (`GOOGLE_GENAI_API_KEY`) |
| CI/CD | Push su `main` → deploy automatico |
| maxInstances | 3 (alzato da 1) |
| Dev locale | `npm run dev` → http://localhost:9002 |

### Variabili d'Ambiente
```
RESEND_API_KEY=...                    (server, Firebase Secret)
GOOGLE_GENAI_API_KEY=...              (server, da configurare)
NEXT_PUBLIC_SUPPORT_EMAIL=info@nexusdigitalbridge.it
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-2511976075-f03a5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## COME PUBBLICARE LE MODIFICHE

```bash
git add .
git commit -m "descrizione modifica"
git push origin main
# → Firebase App Hosting fa il deploy automaticamente in ~3-5 min
```

---

## NOTE ARCHITETTURALI

- **Ruoli Firebase:** `Admin`, `Company`, `Institute` (con maiuscola)
- **Status utente:** `Pending`, `Approved`, `Rejected`
- **Algoritmo matching:** `score = (settoriInComune / max(settoriAzienda, settoriStudente)) * 90 + bonus testuale (max +10)`
- **StudentCVs:** subcollection `institutes/{uid}/studentCVs/{id}` — accessibile via `collectionGroup`
- **Chat:** collection `chats/{id}` con subcollection `messages/{id}` — sicurezza forte via `get()` parent doc
- **`isDemo: true`** flag su dati generati dall'admin dashboard (da filtrare nelle query pubbliche)
