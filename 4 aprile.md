# Piano Lavori — 4 Aprile 2026
## Nexus Digital Bridge — Preparazione Vendita Mercoledì 9 Aprile

---

## STATO FINALE — Fine sessione 4 aprile

### ✅ COMPLETATO OGGI (5 commit)

| Task | Stato | File |
|------|-------|------|
| Cookie Banner GDPR | ✅ | `src/components/CookieBanner.tsx` |
| Fix homepage stats (dati reali Firestore) | ✅ | `src/app/page.tsx` |
| Sezione "Come Funziona" in homepage | ✅ | `src/app/page.tsx` |
| Pagina Prezzi `/pricing` | ✅ | `src/app/pricing/page.tsx` |
| Footer homepage 3 colonne | ✅ | `src/app/page.tsx` |
| Welcome card onboarding dashboard | ✅ | `src/app/dashboard/page.tsx` |
| Pagina Chi Siamo `/about` | ✅ | `src/app/about/page.tsx` |
| Navbar: Come Funziona + Chi Siamo + Prezzi | ✅ | `src/components/layout/Navbar.tsx` |
| Fix Rules of Hooks (dashboard crash) | ✅ | `src/app/dashboard/page.tsx` |
| Admin chats → nomi reali | ✅ | `src/app/admin/chats/page.tsx` |
| PDF upload blocco >10MB | ✅ | `src/app/dashboard/students/page.tsx` |
| Matches search in cvInformation | ✅ | `src/app/dashboard/matches/page.tsx` |
| isDemo filter (search + matches) | ✅ | search + matches pages |
| Sentry client config | ✅ | `sentry.client.config.ts` |
| Badge pending admin users tab | ✅ | `src/app/admin/users/page.tsx` |
| Skeleton loading dashboard + matches | ✅ | 2 pagine |
| Password show/hide toggle login + register | ✅ | login + register pages |
| Chat sidebar nomi reali | ✅ | `src/app/dashboard/chat/page.tsx` |
| Sidebar badge pending Gestione Utenti | ✅ | `src/components/dashboard/Sidebar.tsx` |
| Admin panoramica: dati reali + Recharts | ✅ | `src/app/admin/page.tsx` |
| Rimossi console.error in produzione | ✅ | vari file |
| Rimossa sentry-example-page pubblica | ✅ | eliminato |
| Sidebar avatar iniziali nome+cognome | ✅ | Sidebar.tsx |

---

## COSA MANCA ANCORA — DA FARE PRIMA DI MERCOLEDÌ

### 🔴 Obbligatorio (fai tu, non richiede codice)

1. **P.IVA nel footer** — apri `src/app/page.tsx`, cerca `[inserire]` nel bottom bar e sostituisci con la tua P.IVA reale
2. **Popola dati prima della presentazione** — vai su `/admin/dashboard` → "Inizializza Tabelle" poi "Attiva Demo" per avere dati realistici durante la vendita
3. **Verifica dominio personalizzato** — assicurati che `www.nexusdigitalbridge.it` punti correttamente al Firebase hosting
4. **Testa il flusso completo** — registra un account azienda e uno istituto da un browser in incognito, verifica tutto il flusso

### 🟡 Da fare post-vendita (roadmap tecnica da mostrare al cliente)

| Feature | Priorità | Note |
|---------|----------|------|
| Sistema pagamenti Stripe | Alta | Prima di onboardare clienti paganti |
| Email verification post-registrazione | Alta | Sicurezza base |
| Google SSO | Media | UX migliorata |
| Paginazione Firestore | Alta | Critica oltre 500 utenti |
| Rate limiting AI + Auth | Alta | Anti-abuso |
| Export dati GDPR | Media | Diritto alla portabilità |
| Delete account | Media | Diritto all'oblio |
| Notifiche real-time unread badge | Media | Chat UX |
| Blog rich text editor | Bassa | TipTap o Quill |
| Google Analytics 4 | Media | Analytics vendita |
| Confirm password in registrazione | Bassa | UX |
| Bulk approve/reject utenti admin | Bassa | Admin UX |
| Contratti digitali / DPA | Alta | Obbligatorio per PA |

### 🔵 Debito tecnico aperto (non visibile in demo)

- Firestore rules: chat list troppo permissiva (client-side filter protegge, ma non è il massimo)
- No middleware auth server-side (solo client-side via use-auth-guard)
- maxInstances: 1 in apphosting.yaml (da alzare a 3+ in produzione)
- Secrets in .env committati (spostarli tutti in Firebase Secret Manager)

---

## COMMIT LOG SESSIONE

```
fa05f9e fix: sposta useState/useEffect onboarding (Rules of Hooks)
a381d10 docs: aggiorna 4 aprile.md
3d5a710 feat: cookie banner GDPR, pricing, about, come funziona, onboarding, navbar, footer
aea98a0 feat: admin panoramica reale + Recharts, sidebar avatar, footer contatti
916b939 feat: password toggle, chat nomi reali, sidebar badge pending, stats fix
0c85880 fix: admin chats, isDemo filter, PDF limit, matches search, Sentry client, skeleton
```

**Totale: 6 commit, ~20 file, 1000+ righe aggiunte/modificate**

---

*Aggiornato: 04/04/2026 — Sessione completata*
