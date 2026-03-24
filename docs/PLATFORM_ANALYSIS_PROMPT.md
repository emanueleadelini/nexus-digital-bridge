# Nexus Digital Bridge — Documento di Analisi per AI

> **Come usare questo documento**
> Copia l'intero contenuto di questo file e incollalo come prompt iniziale a **Claude AI** (claude.ai) o **ChatGPT** (chatgpt.com).
> Il documento è auto-contenuto: include tutta la struttura, il codice chiave e i dati necessari per un'analisi completa senza dover accedere al repository.

---

## PROMPT DI SISTEMA (incolla questo come primo messaggio)

Sei un senior software architect e consulente di prodotto. Ti chiedo di analizzare in dettaglio la piattaforma **Nexus Digital Bridge**, una SaaS italiana che connette scuole superiori e aziende per il PCTO (alternanza scuola-lavoro).

Di seguito ti fornisco:
1. Descrizione completa della piattaforma
2. Stack tecnologico
3. Struttura del codice
4. Funzionalità principali
5. Modello dati (Firestore)
6. Regole di sicurezza
7. Problemi noti (bug e anti-pattern)
8. File di codice chiave (estratti rilevanti)

Al termine di tutta la documentazione, ti chiedo di rispondere alle seguenti **5 domande**:

**A. Punti critici** — Quali sono i problemi più gravi che potrebbero causare fallimento in produzione? Ordina per severità.

**B. Punti di forza** — Cosa è stato fatto bene architetturalmente e in termini di prodotto?

**C. Scalabilità** — Con 1.000 / 10.000 / 100.000 utenti attivi, dove collassa prima il sistema?

**D. Roadmap di miglioramento** — Proponi un piano in 3 fasi (Quick Wins / Medio termine / Lungo termine) con effort stimato per ciascuna.

**E. Domande strategiche** — Fai 5 domande al founder/CTO che ti aiuterebbero a capire le priorità di business e guidare le decisioni tecniche.

---

## 1. PANORAMICA DEL PRODOTTO

**Nome**: Nexus Digital Bridge
**Tipo**: SaaS B2B2B (Admin → Aziende + Istituti Scolastici)
**Mercato**: Italia, settore PCTO (ex alternanza scuola-lavoro, D.Lgs. 77/2005)
**Lingua**: Italiano

### Flusso principale
1. Un'**Azienda** o un **Istituto** si registra sulla piattaforma
2. L'**Admin** approva o rifiuta la richiesta (notifiche email automatiche)
3. L'**Istituto** carica i CV degli studenti (manualmente o via parsing AI da PDF Europass)
4. L'**Azienda** vede i match con gli studenti più adatti ai propri settori industriali
5. Azienda e Istituto possono chattare in tempo reale sulla piattaforma
6. L'**Admin** gestisce tutto: utenti, blog, contenuti landing page, settori, tipi di istituto

---

## 2. STACK TECNOLOGICO

```
Framework:        Next.js 15.5.9 (App Router + Turbopack)
Runtime:          React 19.2.1 + TypeScript 5
Database:         Firebase Firestore (NoSQL, real-time)
Auth:             Firebase Authentication (email/password)
Hosting:          Firebase App Hosting
AI:               Google Genkit 1.20.0 + Gemini 2.5 Flash (parsing CV)
Email:            Resend 4.1.2 (transazionali)
UI:               Tailwind CSS 3.4 + shadcn/ui (Radix UI)
Form:             react-hook-form 7.54 + Zod 3.24
Charts:           Recharts 2.15 (importato, non ancora implementato)
Icons:            lucide-react 0.475
Date:             date-fns 3.6 (locale IT)
```

---

## 3. STRUTTURA DEL PROGETTO

```
src/
├── app/
│   ├── page.tsx                    # Landing page pubblica (contenuto da Firestore)
│   ├── layout.tsx                  # Root layout (Firebase provider)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx    # ⚠️ BUG: non funziona (vedi sezione 8)
│   ├── pending-approval/page.tsx
│   ├── rejected/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[id]/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                # ⚠️ Dati hardcoded, non reali
│   │   ├── chat/page.tsx
│   │   ├── matches/page.tsx        # ⚠️ Algoritmo di matching (scalabilità)
│   │   ├── students/page.tsx       # Solo Istituti
│   │   ├── search/page.tsx         # Solo Aziende
│   │   └── profile/page.tsx
│   ├── admin/
│   │   ├── layout.tsx              # Guard: solo Admin
│   │   ├── page.tsx
│   │   ├── dashboard/page.tsx      # Checklist SaaS + demo data
│   │   ├── users/page.tsx          # Approvazione utenti
│   │   ├── blog/page.tsx
│   │   ├── content/page.tsx        # CMS landing page
│   │   ├── chats/page.tsx          # Monitor chat
│   │   ├── sectors/page.tsx        # CRUD settori
│   │   └── institute-types/page.tsx
│   └── actions/
│       └── notifications.ts        # Server Actions (email Resend)
├── ai/
│   ├── genkit.ts
│   └── flows/
│       └── parse-cv-flow.ts        # CV parsing con Gemini 2.5 Flash
├── components/
│   ├── ui/                         # 40+ componenti shadcn/ui
│   ├── layout/Navbar.tsx
│   ├── dashboard/Sidebar.tsx
│   └── FirebaseErrorListener.tsx
├── firebase/
│   ├── config.ts
│   ├── provider.tsx                # React context + hooks custom
│   ├── firestore/
│   │   ├── use-collection.tsx      # Hook real-time collection
│   │   └── use-doc.tsx             # Hook real-time document
│   └── errors.ts
├── hooks/
│   ├── use-auth-guard.ts
│   └── use-mobile.tsx
├── lib/
│   ├── constants.ts                # INDUSTRY_SECTORS, INSTITUTE_TYPES
│   └── utils.ts
└── types/
    └── index.ts                    # Interfacce TypeScript core
```

---

## 4. MODELLO DATI (FIRESTORE)

### Collezioni principali

```
/users/{uid}
  - email: string
  - role: "Admin" | "Company" | "Institute"
  - status: "Pending" | "Approved" | "Rejected"
  - companyName / instituteName: string
  - createdAt: Timestamp

/companies/{uid}
  - companyName: string
  - sector: string[]          # Settori industriali selezionati
  - address: string
  - description: string
  - status: "Pending" | "Approved" | "Rejected"

/institutes/{uid}
  - instituteName: string
  - sector: string[]
  - instituteTypes: string[]  # Tipo di scuola (Liceo, ITIS, ecc.)
  - address: string
  - description: string
  - status: "Pending" | "Approved" | "Rejected"

/institutes/{uid}/studentCVs/{cvId}    # Subcollection
  - studentName: string
  - class: string
  - summary: string           # Riassunto professionale
  - cvInformation: string     # Testo libero dal CV
  - suggestedSectors: string[]
  - createdAt: Timestamp

/chats/{chatId}
  - companyId: string
  - instituteId: string
  - companyName: string
  - instituteName: string
  - messages: string[]        # ⚠️ Array di stringhe "email: messaggio"
  - lastMessage: string
  - lastMessageTime: Timestamp
  - createdAt: Timestamp

/sectors/{id}
  - name: string
  - description: string

/instituteTypes/{id}
  - name: string

/blogPosts/{id}
  - title: string
  - content: string
  - excerpt: string
  - imageUrl: string
  - createdAt: Timestamp

/config/landingPage               # Documento singolo CMS
  - heroTitle: string
  - heroSubtitle: string
  - features: array
  - stats: array
  - (altri campi CMS)
```

---

## 5. ALGORITMO DI MATCHING ("Nexus v3.0")

```typescript
// Logica estratta da /src/app/dashboard/matches/page.tsx

// 1. Carica TUTTI i CV da tutto il sistema via collectionGroup
const allCVsQuery = query(
  collectionGroup(db, "studentCVs"),
  where("suggestedSectors", "array-contains-any", companySectors)
);

// 2. Calcola score per ogni studente
function calculateMatchScore(student: StudentCV, company: Company): number {
  const commonSectors = student.suggestedSectors.filter(s =>
    company.sector.includes(s)
  );

  // Copertura settoriale: max 90%
  const sectorCoverage = (commonSectors.length / company.sector.length) * 90;

  // Bonus keyword: settori non matchati cercati nel testo CV
  const unmatchedSectors = company.sector.filter(s => !commonSectors.includes(s));
  let keywordBonus = 0;
  unmatchedSectors.forEach(sector => {
    if (student.cvInformation?.toLowerCase().includes(sector.toLowerCase())) {
      keywordBonus += 5;
    }
  });
  keywordBonus = Math.min(keywordBonus, 10); // cap 10%

  return sectorCoverage + keywordBonus; // max 100%
}

// 3. Filtra e ordina
const matches = allStudents
  .map(s => ({ ...s, score: calculateMatchScore(s, company) }))
  .filter(s => s.score > 0)
  .sort((a, b) => b.score - a.score);
```

**Problema critico**: con N istituti e M studenti per istituto, vengono caricati N×M documenti nel browser.

---

## 6. REGOLE DI SICUREZZA FIRESTORE

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function isAdmin() { return getUserRole() == 'Admin'; }
    function isApproved() { return getUserStatus() == 'Approved'; }
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function getUserStatus() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status;
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }

    match /companies/{companyId} {
      allow list: if isAuthenticated() && isApproved();
      allow get: if isAuthenticated() && (request.auth.uid == companyId || isAdmin());
      allow create: if isAuthenticated() && request.auth.uid == companyId;
      allow update: if isAuthenticated() && (request.auth.uid == companyId || isAdmin());
    }

    match /institutes/{instituteId} {
      allow list: if isAuthenticated() && isApproved();
      allow get: if isAuthenticated() && (request.auth.uid == instituteId || isAdmin());
      allow create: if isAuthenticated() && request.auth.uid == instituteId;
      allow update: if isAuthenticated() && (request.auth.uid == instituteId || isAdmin());

      match /studentCVs/{cvId} {
        allow read: if isAuthenticated() && isApproved();
        allow create, update: if isAuthenticated() && isApproved()
                              && request.auth.uid == instituteId
                              && getUserRole() == 'Institute';
        allow delete: if isAuthenticated() && request.auth.uid == instituteId;
      }
    }

    // ⚠️ VULNERABILITÀ: list senza filtro permette di leggere tutte le chat
    match /chats/{chatId} {
      allow list: if isAuthenticated() && isApproved();
      allow get: if isAuthenticated() && (
        resource.data.companyId == request.auth.uid ||
        resource.data.instituteId == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated() && isApproved();
      allow update: if isAuthenticated() && isApproved() && (
        resource.data.companyId == request.auth.uid ||
        resource.data.instituteId == request.auth.uid
      ) && request.resource.data.companyId == resource.data.companyId
        && request.resource.data.instituteId == resource.data.instituteId;
    }

    match /sectors/{sectorId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }

    match /blogPosts/{postId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }

    match /config/{configId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }

    // collectionGroup per matching
    match /{path=**}/studentCVs/{cvId} {
      allow list: if isAuthenticated() && isApproved();
    }
  }
}
```

---

## 7. CODICE CHIAVE — ESTRATTI

### 7.1 Provider Firebase (pattern custom hook)
```typescript
// src/firebase/provider.tsx
export function useAuth() {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);
  return user;
}

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const value = useMemo(factory, deps);
  // Previene infinite loop: lancia errore se il ref non è memoizzato
  const stableRef = useRef(value);
  if (stableRef.current !== value && deps.every((d, i) => d === deps[i])) {
    throw new Error("useMemoFirebase: reference changed without dependency change");
  }
  return value;
}
```

### 7.2 Parsing CV con Gemini
```typescript
// src/ai/flows/parse-cv-flow.ts
'use server';

const ParseCVOutputSchema = z.object({
  studentName: z.string(),
  class: z.string(),
  summary: z.string(),
  suggestedSectors: z.array(z.string()),
});

export async function parseCVFromPDF(pdfDataUri: string, availableSectors: string[]) {
  const result = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: [
      { media: { url: pdfDataUri, contentType: 'application/pdf' } },
      { text: `Analizza questo CV Europass e restituisci: nome studente, classe/anno,
               riassunto professionale, settori Confindustria suggeriti tra: ${availableSectors.join(', ')}` }
    ],
    output: { schema: ParseCVOutputSchema },
  });
  return result.output;
}
```

### 7.3 Notifiche email (Server Actions)
```typescript
// src/app/actions/notifications.ts
'use server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emanueleadelini@gmail.com'; // ⚠️ email hardcoded

export async function sendApprovalEmail(userEmail: string, userName: string) {
  await resend.emails.send({
    from: 'Nexus Digital Bridge <noreply@nexusdigitalbridge.it>',
    to: userEmail,
    subject: 'Il tuo account è stato approvato!',
    html: `<h1>Benvenuto ${userName}!</h1><p>Il tuo account è stato approvato...</p>`
  });
}
```

### 7.4 Chat (problema struttura dati)
```typescript
// src/app/dashboard/chat/page.tsx
// ⚠️ Messaggi come array di stringhe
const handleSendMessage = async () => {
  const messageString = `${currentUser.email}: ${newMessage}`;
  await updateDoc(chatRef, {
    messages: arrayUnion(messageString),  // formato fragile
    lastMessage: newMessage,
    lastMessageTime: serverTimestamp(),
  });
};

// Parsing fragile
const [senderEmail, ...messageParts] = msg.split(": ");
const messageText = messageParts.join(": "); // workaround parziale
```

### 7.5 Dashboard con dati finti
```typescript
// src/app/dashboard/page.tsx
// ⚠️ Tutti hardcoded - non vengono da Firestore
<StatCard title="Match Trovati" value="12" icon={Users} />
<StatCard title="Messaggi Inviati" value="48" icon={MessageSquare} />
<StatCard title="Profili Visitati" value="24" icon={Eye} />

// Activity items hardcoded
const activities = [
  { name: "Marco Bianchi", action: "ha visualizzato il tuo profilo" },
  { name: "Tech Solutions SRL", action: "ti ha inviato un messaggio" },
];
```

---

## 8. PROBLEMI NOTI (BUG + ANTI-PATTERN)

| # | Severità | Tipo | Descrizione |
|---|----------|------|-------------|
| 1 | 🔴 CRITICO | Bug | **Forgot Password non funziona** — mostra success toast senza chiamare `sendPasswordResetEmail()` di Firebase |
| 2 | 🔴 CRITICO | Deploy | **`apphosting.yaml` ha chiave placeholder** — `value: YOUR_RESEND_API_KEY_HERE` — le email non funzionano in produzione |
| 3 | 🟠 ALTO | Scalabilità | **Matching carica tutti i CV nel browser** — collectionGroup senza paginazione, esplode con molti studenti |
| 4 | 🟠 ALTO | Sicurezza | **Chat `list` rule aperta** — qualsiasi utente approvato può leggere tutte le chat ignorando il filtro client-side |
| 5 | 🟠 ALTO | Dato | **Messaggi chat come array di stringhe** — struttura fragile, non scalabile, impossibile query |
| 6 | 🟡 MEDIO | Qualità | **TypeScript ed ESLint disabilitati in build** — `ignoreBuildErrors: true` in `next.config.ts` |
| 7 | 🟡 MEDIO | Sicurezza | **Email admin hardcoded nel codice** — `emanueleadelini@gmail.com` visibile nel repo |
| 8 | 🟡 MEDIO | UX | **Dashboard mostra dati finti** — statistiche e activity feed hardcoded, non reali |
| 9 | 🟡 MEDIO | Bug | **Blog image URL generata una volta sola** — `Math.random()` a livello modulo, tutti i post della sessione hanno la stessa immagine |
| 10 | 🟢 BASSO | Codice | **`non-blocking-login.tsx` non usato** — file morto |
| 11 | 🟢 BASSO | Codice | **`any` type in componenti** — `StatCard({ }: any)`, `selectedInstitute: any` |

---

## 9. PUNTI DI FORZA

1. **Architettura Firebase solida** — Context provider ben strutturato, hooks riutilizzabili (`useCollection`, `useDoc`), pattern `useMemoFirebase` contro infinite loop
2. **Firestore security rules ben pensate** — funzioni helper riutilizzabili, separazione per role/status
3. **AI CV parsing funzionale** — integrazione Genkit + Gemini 2.5 Flash per parsing Europass, schema Zod per output strutturato
4. **Stack moderno e produttivo** — Next.js 15, React 19, Turbopack, shadcn/ui
5. **Admin panel completo** — CMS, user management, blog, monitoring chat, generatore dati demo
6. **Separazione netta dei ruoli** — Admin / Company / Institute con routing dedicato
7. **Email transazionali funzionanti** — 4 trigger email (registrazione, benvenuto, approvazione, rifiuto)
8. **Chat real-time** — implementata con Firestore real-time listeners

---

## 10. CONTESTO DI BUSINESS

- **Modello di monetizzazione**: non ancora definito nel codice (nessun Stripe/payment)
- **Compliance GDPR**: privacy policy presente, ma non c'è cookie consent, né data deletion flow
- **Target geografico**: Italia (locale it, PCTO, settori Confindustria)
- **Fase attuale**: MVP funzionale, pre-lancio
- **Deployment**: Firebase App Hosting, dominio target `nexusdigitalbridge.it`
- **Team**: sviluppo apparentemente mono-developer

---

## FINE DOCUMENTAZIONE — ORA RISPONDI ALLE 5 DOMANDE

Ricorda le domande A-E indicate all'inizio:

**A.** Punti critici ordinati per severità (con impatto concreto sul business)
**B.** Punti di forza architetturali e di prodotto
**C.** Analisi di scalabilità a 1K / 10K / 100K utenti
**D.** Roadmap in 3 fasi: Quick Wins / Medio termine / Lungo termine
**E.** 5 domande strategiche per il founder/CTO

Sii specifico, pratico, e dove possibile proponi soluzioni concrete con esempi di codice o pattern architetturali.
