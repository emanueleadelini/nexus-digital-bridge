"use client";

import { Navbar } from "@/components/layout/Navbar";
import { GraduationCap, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Torna alla Home
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Termini di Servizio</h1>
            <p className="text-slate-500">Regolamento per l'utilizzo della piattaforma Nexus Digital Bridge - Anno 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">1. Descrizione del Servizio</h2>
            <p className="text-slate-600 leading-relaxed">
              Nexus Digital Bridge è una piattaforma tecnologica di matching che mette in collegamento Istituti Scolastici e Aziende. Il servizio è fornito "così com'è" per facilitare l'incontro tra domanda professionale e offerta formativa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">2. Registrazione e Approvazione</h2>
            <p className="text-slate-600 leading-relaxed">
              L'accesso alla piattaforma è subordinato a una verifica manuale. Ci riserviamo il diritto insindacabile di rifiutare l'accesso a soggetti che non forniscano garanzie di serietà o che operino al di fuori delle finalità educative e professionali previste.
            </p>
          </section>

          <section className="space-y-4 p-6 bg-orange-50 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-xl font-bold">3. Responsabilità sui Dati e Minorenni</h2>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed">
              Questa è una clausola fondamentale: gli Istituti Scolastici che caricano profili di studenti (StudentCV) sono gli **unici e totali responsabili** del trattamento di tali dati.
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-2 text-sm">
              <li><strong>Consenso Minori:</strong> L'Istituto garantisce, sotto la propria esclusiva responsabilità, di aver acquisito preventivamente il consenso scritto dai genitori o dai tutori legali per il caricamento e la diffusione dei dati degli studenti minorenni sulla piattaforma.</li>
              <li><strong>Veridicità:</strong> Gli utenti (Aziende e Istituti) sono responsabili della veridicità delle informazioni inserite. La piattaforma non effettua controlli di merito sui contenuti caricati dai singoli utenti.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">4. Limitazione di Responsabilità del Creatore</h2>
            <p className="text-slate-600 leading-relaxed">
              Emanuele Adelini, in qualità di creatore e amministratore della piattaforma, fornisce esclusivamente l'infrastruttura tecnologica e non potrà essere ritenuto responsabile in alcun caso per:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>L'accuratezza, la legalità o la liceità dei dati inseriti dagli utenti (Aziende, Istituti, Studenti).</li>
              <li>Eventuali violazioni della privacy commesse dagli Istituti o dalle Aziende durante l'uso del servizio.</li>
              <li>L'esito delle trattative, la qualità dei tirocini o la stipula di eventuali contratti di lavoro.</li>
              <li>Danni derivanti da interruzioni del servizio o perdite di dati non imputabili a colpa grave.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">5. Divieti e Abusi</h2>
            <p className="text-slate-600 leading-relaxed">
              È vietato l'uso della piattaforma per finalità diverse dal matching professionale. Qualsiasi tentativo di molestia, uso di linguaggio inappropriato nella chat o tentativo di estorsione di dati sensibili comporterà l'immediata cancellazione dell'account e la segnalazione alle autorità competenti.
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
          <p className="text-slate-500 text-sm">© 2026 Nexus Digital Bridge. "Colleghiamo oggi il talento di domani."</p>
        </div>
      </footer>
    </div>
  );
}