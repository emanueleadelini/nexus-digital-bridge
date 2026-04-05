"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Lightbulb, Heart, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

const VALUES = [
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Trasparenza",
    description: "Algoritmo di matching aperto e comprensibile. Nessuna scatola nera: ogni score è spiegabile e verificabile.",
  },
  {
    icon: <Lightbulb className="w-7 h-7" />,
    title: "Innovazione",
    description: "AI al servizio dell'orientamento professionale. Parsing automatico dei CV Europass con tecnologia Gemini 2.5 Flash.",
  },
  {
    icon: <Heart className="w-7 h-7" />,
    title: "Impatto Sociale",
    description: "Ogni match creato è un giovane che trova la strada giusta. Il profitto non può venire prima delle persone.",
  },
];

const NUMBERS = [
  { value: "13", label: "Settori Confindustria integrati" },
  { value: "v3.0", label: "Algoritmo di matching" },
  { value: "1", label: "Anno di sviluppo" },
  { value: "100%", label: "Supporto italiano" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-headline font-bold leading-tight">
            Il Progetto Nexus<br />Digital Bridge
          </h1>
          <p className="text-blue-100 text-xl leading-relaxed max-w-2xl mx-auto">
            Nati per connettere il talento italiano con le opportunità reali.
          </p>
        </div>
      </section>

      {/* Missione */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <p className="text-secondary font-bold text-sm uppercase tracking-widest mb-3">La nostra missione</p>
                <h2 className="text-3xl font-headline font-bold text-primary leading-tight">
                  Eliminare il gap tra scuola e lavoro
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                In Italia, ogni anno milioni di studenti cercano orientamento professionale. Ogni anno, migliaia di aziende faticano a trovare talenti formati nei loro settori.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Nexus Digital Bridge elimina questo gap attraverso tecnologia e matching intelligente. Non siamo un job board: siamo un ponte strutturale tra il sistema educativo e quello produttivo.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-10 text-white space-y-4">
              <div className="text-6xl font-bold font-headline opacity-20">?</div>
              <h3 className="text-2xl font-headline font-bold">Il problema che risolviamo</h3>
              <ul className="space-y-3 text-blue-100 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold shrink-0">→</span>
                  Studenti senza orientamento professionale concreto
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold shrink-0">→</span>
                  Aziende che faticano a trovare profili settoriali
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold shrink-0">→</span>
                  PCTO organizzati senza matching reale di competenze
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Come siamo nati */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <p className="text-secondary font-bold text-sm uppercase tracking-widest">Come siamo nati</p>
          <h2 className="text-3xl font-headline font-bold text-primary">Costruito da chi ha vissuto il problema</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            Nexus Digital Bridge è un progetto di <strong>AD Next Lab</strong>, una software house italiana specializzata in prodotti SaaS per il mercato B2B.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Abbiamo visto da vicino il problema del mismatch scuola-lavoro — nelle aziende nostre clienti, nei racconti degli istituti del territorio, nelle statistiche ISTAT sul disallineamento occupazionale. Abbiamo deciso di risolverlo con gli strumenti che conosciamo meglio: tecnologia, dati, design.
          </p>
        </div>
      </section>

      {/* Valori */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="text-secondary font-bold text-sm uppercase tracking-widest">I nostri valori</p>
            <h2 className="text-3xl font-headline font-bold text-primary">Cosa ci guida ogni giorno</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {VALUES.map((v) => (
              <Card key={v.title} className="border-none shadow-xl hover:shadow-2xl transition-shadow rounded-3xl">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold font-headline text-primary">{v.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Numeri */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            {NUMBERS.map((n) => (
              <div key={n.label} className="space-y-2">
                <div className="text-4xl font-bold font-headline text-secondary">{n.value}</div>
                <div className="text-blue-200 text-sm">{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <h2 className="text-3xl font-headline font-bold text-primary">Unisciti alla rete</h2>
          <p className="text-slate-500 leading-relaxed">
            Sei un istituto che vuole valorizzare i propri studenti o un&apos;azienda alla ricerca di talenti settoriali? La rete Nexus ti aspetta.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-secondary/20" asChild>
              <Link href="/register">Registrati ora</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-bold h-14 px-8 rounded-xl" asChild>
              <Link href="/pricing">Vedi i Prezzi</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer minimo */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-secondary text-white p-1 rounded-lg">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-headline font-bold">Nexus Digital Bridge</span>
            </div>
            <div className="flex gap-6 text-slate-400 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Termini</Link>
              <Link href="/pricing" className="hover:text-white transition-colors flex items-center gap-1">
                Prezzi <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-slate-500 text-xs">© 2026 Nexus Digital Bridge by AD Next Lab</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
