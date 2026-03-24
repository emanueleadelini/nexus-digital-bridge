"use client";

import { Navbar } from "@/components/layout/Navbar";
import { GraduationCap, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Torna alla Home
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Informativa sulla Privacy (GDPR)</h1>
            <p className="text-slate-500">Ultimo aggiornamento: Maggio 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">1. Titolare del Trattamento</h2>
            <p className="text-slate-600 leading-relaxed">
              Il titolare della piattaforma tecnologica è Nexus Digital Bridge di Emanuele Adelini (email: emanueleadelini@gmail.com). 
              Nexus Digital Bridge funge da fornitore del servizio tecnologico e gestore dell'infrastruttura.
            </p>
          </section>

          <section className="space-y-4 p-6 bg-blue-50 rounded-2xl">
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-xl font-bold">2. Ruoli e Responsabilità sui Dati dei Minori</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">
              È fondamentale distinguere i ruoli per quanto riguarda la protezione dei dati:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2 font-medium">
              <li><strong>Istituti Scolastici:</strong> Agiscono come "Titolari Autonomi" dei dati degli studenti che caricano. L'Istituto è l'unico responsabile di aver ottenuto i consensi necessari dai genitori per i minori di 18 anni.</li>
              <li><strong>Nexus Digital Bridge:</strong> Fornisce esclusivamente il database e gli strumenti di matching, agendo come "Responsabile Esterno" del trattamento per gli aspetti puramente tecnici.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">3. Dati Raccolti</h2>
            <p className="text-slate-600 leading-relaxed">
              Raccogliamo solo i dati strettamente necessari:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Dati account (Email, Nome, Ruolo).</li>
              <li>Dati professionali (Settori merceologici, CV caricati dagli istituti).</li>
              <li>Log di sistema per garantire la sicurezza degli accessi.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">4. Finalità del Trattamento</h2>
            <p className="text-slate-600 leading-relaxed">
              I dati sono usati esclusivamente per:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Matching intelligente basato sui settori merceologici.</li>
              <li>Comunicazioni dirette via chat tra Aziende e Istituti.</li>
              <li>Invio di notifiche di sistema relative all'account.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">5. I tuoi Diritti</h2>
            <p className="text-slate-600 leading-relaxed">
              In conformità al GDPR, ogni utente ha il diritto di richiedere l'accesso, la rettifica o la cancellazione definitiva dei propri dati. Gli Istituti sono responsabili della gestione delle richieste di cancellazione provenienti dai propri studenti. 
              Per qualsiasi richiesta tecnica, potete scrivere a: emanueleadelini@gmail.com.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="font-headline font-bold text-2xl">Nexus Digital Bridge</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Nexus Digital Bridge. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}