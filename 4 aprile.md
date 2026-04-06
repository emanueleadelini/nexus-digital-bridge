# Piano Lavori — 4 Aprile 2026
## Nexus Digital Bridge — Preparazione Vendita Mercoledì 9 Aprile

---

## OBIETTIVO
Portare la piattaforma da demo a prodotto vendibile. Ogni punto è critico per una vendita B2B italiana.

---

## TODO LIST

### 🔴 CRITICO — Deal Killer

- [x] **Cookie Banner GDPR** — componente custom con localStorage, link a Privacy Policy, accetta/rifiuta
- [x] **Fix homepage stats** — rimossi numeri falsi, sostituiti con conteggi reali da Firestore (companies + institutes)
- [x] **Sezione "Come Funziona"** — 3 step visivi in homepage (Registrati → Configura → Connettiti), `id="come-funziona"` per anchor
- [x] **Pagina Prezzi** (`/pricing`) — 3 tier: Istituto gratuito / Starter €49/mese / Pro contattaci, FAQ accordion, CTA
- [x] **Footer completo** — 3 colonne: logo+tagline / link utili / contatti AD Next Lab, bottom bar copyright

### 🟡 IMPORTANTE — Credibilità

- [x] **Welcome card onboarding** — card gradient nella dashboard, role-aware (Company vs Institute), dismiss localStorage
- [x] **Pagina "Chi Siamo"** (`/about`) — missione, origine AD Next Lab, 3 valori, numeri, CTA
- [x] **Navbar aggiornata** — aggiunti link "Come Funziona", "Chi Siamo", "Prezzi" (desktop + mobile)
- [ ] **Homepage CTA secondaria** — bottone "Scopri Come Funziona" accanto a "Inizia Ora" (non implementato)

### 🟢 POLISH — Finiture

- [ ] **Meta tags SEO** — title, description, og:image (già presenti in layout.tsx da sessione precedente — OK)
- [ ] **Admin content**: estensione gestione stats homepage (non toccato)

---

## STATO AVANZAMENTO AGGIORNATO

| Task | Stato | Note |
|------|-------|------|
| Cookie Banner GDPR | ✅ Completato | `src/components/CookieBanner.tsx`, localStorage, mobile-first |
| Fix homepage stats | ✅ Completato | Query Firestore reali su companies/institutes, filtro isDemo |
| Sezione Come Funziona | ✅ Completato | 3 step, `id="come-funziona"`, link navbar funzionante |
| Pagina Prezzi `/pricing` | ✅ Completato | 3 card + Accordion FAQ + Trusted By + CTA |
| Footer completo | ✅ Completato | 3 colonne bg-slate-900, bottom bar |
| Welcome onboarding | ✅ Completato | Solo utenti Approved, role-aware, dismiss persistente |
| Pagina Chi Siamo `/about` | ✅ Completato | Hero + missione + valori + numeri + CTA |
| Navbar aggiornata | ✅ Completato | Come Funziona, Chi Siamo, Prezzi — desktop + mobile |
| Homepage CTA secondaria | ⏳ Non fatto | Non implementato in questa sessione |
| Meta tags SEO | ✅ Già presenti | Configurati in sessione precedente (layout.tsx) |

---

## COSA MANCA ANCORA (post-sessione 4 aprile)

### Non implementato questa sessione

| Elemento | Motivo / Note |
|----------|---------------|
| **P.IVA nel footer** | Non fornita — presente stringa generica senza P.IVA reale |
| **Frecce visive tra step "Come Funziona"** | Struttura presente, raffinamento visivo da testare su mobile |
| **Homepage CTA secondaria** | Non richiesta come priorità assoluta, da aggiungere post-vendita |
| **Email verification post-registrazione** | Richiede modifica flusso Firebase Auth — bug aperto |
| **Google SSO** | Dipendenza aggiuntiva — non implementato |
| **Paginazione Firestore** | Architettura da riprogettare — critico oltre 1000 records |
| **Rate limiting su AI/Auth** | Richiede middleware o soluzione serverless |
| **Notifiche real-time (badge unread)** | Richiede listener Firestore su messaggi + stato globale |
| **Blog editor rich text** | Richiederebbe dipendenza aggiuntiva (es. TipTap) |
| **Google Analytics 4** | Non richiesto esplicitamente in questa sessione |
| **Confirm password nel form registrazione** | Non toccato |
| **PDF size limit (10MB check)** | Bug aperto — non toccato |
| **Admin chats con nomi reali** | Bug aperto — richiederebbe query cross-collection |
| **Bulk approve/reject utenti** | Feature roadmap |

### Da completare PRIMA del 9 aprile (raccomandato)

1. **Inserire P.IVA reale** nel footer (`src/app/page.tsx` riga bottom bar)
2. **Testare su mobile** la sezione "Come Funziona" e il footer a 3 colonne
3. **Verificare** che la query Firestore `where("isDemo", "!=", true)` abbia l'index su Firebase Console
4. **Popolare** alcuni dati reali (almeno 3-4 companies e 2-3 institutes approvati) prima della demo

### Da completare post-vendita

- Sistema pagamenti Stripe
- Email verification post-registrazione
- Google SSO
- Paginazione Firestore (critica oltre 500 utenti)
- Rate limiting endpoint AI
- Export dati GDPR (diritto alla portabilità)
- Delete account (diritto all'oblio)
- Contratti digitali / DPA (Data Processing Agreement)

---

## COMMIT SESSIONE 4 APRILE

```
3d5a710 feat: cookie banner GDPR, pricing, about, come funziona, onboarding, navbar, footer
```

**7 file modificati, 710 inserzioni, 27 eliminazioni**

File toccati:
- `src/components/CookieBanner.tsx` ← NUOVO
- `src/app/about/page.tsx` ← NUOVO
- `src/app/pricing/page.tsx` ← NUOVO
- `src/app/layout.tsx` ← modificato
- `src/components/layout/Navbar.tsx` ← modificato
- `src/app/page.tsx` ← modificato
- `src/app/dashboard/page.tsx` ← modificato

---

*Aggiornato: 04/04/2026 — Fine sessione lavori*
