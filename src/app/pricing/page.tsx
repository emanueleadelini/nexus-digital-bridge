"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, GraduationCap, Mail, ChevronRight } from "lucide-react";
import Link from "next/link";

const INSTITUTE_FEATURES = [
  "Upload CV studenti illimitati",
  "Parsing AI automatico (Gemini)",
  "Visibilità su tutte le aziende",
  "Chat diretta con aziende",
  "Dashboard statistiche",
];

const STARTER_FEATURES = [
  "Accesso database studenti",
  "Matching intelligente settoriale",
  "Chat illimitate con istituti",
  "Fino a 3 settori merceologici",
  "Supporto email",
];

const PRO_FEATURES = [
  "Tutto di Starter",
  "Settori merceologici illimitati",
  "API access",
  "Reportistica avanzata",
  "Account manager dedicato",
  "SLA garantito",
];

const TRUSTED_LOGOS = [
  { initials: "AB", color: "bg-blue-500", name: "Azienda Beta" },
  { initials: "TC", color: "bg-green-500", name: "Tech Corp" },
  { initials: "MI", color: "bg-purple-500", name: "Made in IT" },
  { initials: "FS", color: "bg-orange-500", name: "Future Skills" },
  { initials: "NI", color: "bg-rose-500", name: "Nexus Italia" },
];

const FAQS = [
  {
    q: "Gli istituti devono pagare per usare la piattaforma?",
    a: "No, gli istituti scolastici accedono a Nexus Digital Bridge completamente gratis. Crediamo che facilitare il collegamento tra scuola e lavoro non debba avere barriere economiche per le istituzioni educative.",
  },
  {
    q: "Posso provare il piano Starter prima di acquistare?",
    a: "Sì, offriamo 30 giorni di prova gratuita per le aziende che si registrano. Nessuna carta di credito richiesta. Puoi esplorare tutte le funzionalità e cancellare in qualsiasi momento.",
  },
  {
    q: "Come funziona l'algoritmo di matching?",
    a: "Nexus 3.0 analizza i settori merceologici Confindustria selezionati dalla tua azienda e li confronta con i profili e i CV degli studenti degli istituti registrati. Lo score di compatibilità (0-100) tiene conto della copertura settoriale e di bonus testuali per affinità specifiche.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-20 text-center">
        <div className="container mx-auto px-4 space-y-4 max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold">Piani e Prezzi</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Semplici, trasparenti, adatti a ogni realtà. Gli istituti accedono sempre gratis.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">

            {/* Istituto */}
            <Card className="border-2 border-slate-200 shadow-lg rounded-3xl overflow-hidden">
              <CardHeader className="bg-white pt-8 pb-6 px-8 space-y-4">
                <Badge variant="secondary" className="w-fit text-xs font-bold uppercase tracking-wider">
                  Sempre Gratuito
                </Badge>
                <div>
                  <h2 className="text-2xl font-headline font-bold text-primary">Istituto</h2>
                  <p className="text-slate-500 text-sm mt-1">Per scuole e istituti formativi</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold font-headline text-primary">€0</span>
                  <span className="text-slate-400 text-sm mb-2">/anno</span>
                </div>
              </CardHeader>
              <CardContent className="bg-white px-8 pb-8 space-y-6">
                <ul className="space-y-3">
                  {INSTITUTE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full rounded-xl border-primary text-primary hover:bg-primary hover:text-white font-bold" asChild>
                  <Link href="/register">Registra il tuo Istituto</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Starter — highlighted */}
            <Card className="border-2 border-secondary shadow-2xl rounded-3xl overflow-hidden scale-105">
              <CardHeader className="bg-secondary pt-8 pb-6 px-8 space-y-4">
                <Badge className="w-fit text-xs font-bold uppercase tracking-wider bg-white text-secondary hover:bg-white">
                  Più Scelto
                </Badge>
                <div>
                  <h2 className="text-2xl font-headline font-bold text-white">Azienda Starter</h2>
                  <p className="text-white/70 text-sm mt-1">Per PMI e professionisti HR</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold font-headline text-white">€49</span>
                  <span className="text-white/70 text-sm mb-2">/mese</span>
                </div>
                <p className="text-white/60 text-xs">oppure €490/anno — risparmia 2 mesi</p>
              </CardHeader>
              <CardContent className="bg-white px-8 pb-8 space-y-6">
                <ul className="space-y-3 pt-2">
                  {STARTER_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold shadow-lg shadow-secondary/20" asChild>
                  <Link href="/register">Inizia Gratis 30 giorni</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-2 border-slate-200 shadow-lg rounded-3xl overflow-hidden">
              <CardHeader className="bg-white pt-8 pb-6 px-8 space-y-4">
                <Badge variant="outline" className="w-fit text-xs font-bold uppercase tracking-wider border-primary text-primary">
                  Tutto Incluso
                </Badge>
                <div>
                  <h2 className="text-2xl font-headline font-bold text-primary">Azienda Pro</h2>
                  <p className="text-slate-500 text-sm mt-1">Per grandi realtà e gruppi</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold font-headline text-primary">Contattaci</span>
                </div>
                <p className="text-slate-400 text-xs">Prezzo su misura per le tue esigenze</p>
              </CardHeader>
              <CardContent className="bg-white px-8 pb-8 space-y-6">
                <ul className="space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full rounded-xl border-primary text-primary hover:bg-primary hover:text-white font-bold" asChild>
                  <Link href="mailto:info@nexusdigitalbridge.it">
                    <Mail className="w-4 h-4 mr-2" />
                    Contatta il Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4 text-center space-y-8">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Già utilizzato da</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {TRUSTED_LOGOS.map((logo) => (
              <div key={logo.name} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className={`w-10 h-10 rounded-full ${logo.color} text-white font-bold text-sm flex items-center justify-center`}>
                  {logo.initials}
                </div>
                <span className="text-slate-600 font-semibold text-sm">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-headline font-bold text-primary">Domande Frequenti</h2>
            <p className="text-slate-500">Tutto quello che devi sapere prima di iniziare.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-slate-200 rounded-2xl px-6 shadow-sm">
                <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4 space-y-6 max-w-2xl">
          <h2 className="text-3xl lg:text-4xl font-headline font-bold">Pronto a iniziare?</h2>
          <p className="text-blue-100 text-lg">
            Unisciti a decine di aziende e istituti che usano Nexus Digital Bridge per costruire il futuro del lavoro italiano.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-secondary/20" asChild>
              <Link href="/register">Registrati Gratis</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold h-14 px-8 rounded-xl" asChild>
              <Link href="/about">Scopri di più</Link>
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
              <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1">
                Chi Siamo <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-slate-500 text-xs">© 2026 Nexus Digital Bridge by AD Next Lab</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
