
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Layout, Save, Image as ImageIcon, Loader2, List, BarChart3 } from "lucide-react";
import { useApiData, apiFetch } from "@/lib/api";

const DEFAULTS = {
  heroTitle: "Il Ponte Digitale tra Talento e Opportunità",
  heroSubtitle: "Colleghiamo Istituti Scolastici e Aziende attraverso un sistema di matching intelligente basato sui settori merceologici reali.",
  heroImageUrl: "",
  featuresTitle: "Un'ecosistema costruito per il valore",
  featuresSubtitle: "Abbiamo creato strumenti specifici per ogni attore del sistema scolastico-produttivo.",
  feature1Title: "Per le Aziende",
  feature1Desc: "Accedi a un database di profili studenti filtrati per settori merceologici affini alla tua attività. Inizia conversazioni dirette con gli istituti.",
  feature2Title: "Per gli Istituti",
  feature2Desc: "Valorizza il percorso dei tuoi studenti caricando i loro CV. Ricevi notifiche quando un'azienda mostra interesse per i tuoi profili.",
  feature3Title: "Matching Intelligente",
  feature3Desc: "Il nostro algoritmo analizza i settori merceologici Confindustria per suggerire le connessioni più promettenti tra domanda e offerta.",
  stat1Label: "Aziende Iscritte",
  stat1Value: "450+",
  stat2Label: "Istituti Partner",
  stat2Value: "120+",
  stat3Label: "CV Studenti",
  stat3Value: "8,500+",
  stat4Label: "Conversazioni",
  stat4Value: "15k",
};

type ConfigForm = typeof DEFAULTS;

export default function AdminContentPage() {
  const { toast } = useToast();
  const { data: config, isLoading } = useApiData<Partial<ConfigForm>>("/api/admin/content");
  const [formData, setFormData] = useState<ConfigForm>(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) setFormData({ ...DEFAULTS, ...config });
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await apiFetch("/api/admin/content", { method: "PUT", json: formData });
    setIsSaving(false);
    if (res.ok) {
      toast({ title: "Contenuti aggiornati", description: "La landing page è stata aggiornata." });
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile salvare i contenuti." });
    }
  };

  const set = (key: keyof ConfigForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [key]: e.target.value });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Gestione Contenuti</h1>
              <p className="text-slate-500">Personalizza ogni sezione della Landing Page.</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-2xl">
              <Layout className="w-8 h-8" />
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="hero" className="border-none shadow-xl bg-white rounded-xl overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-secondary" />
                  <span className="text-lg font-bold">Sezione Hero (Copertina)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                <div className="space-y-2">
                  <Label>Titolo Principale</Label>
                  <Input value={formData.heroTitle} onChange={set("heroTitle")} className="rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label>Sottotitolo</Label>
                  <Textarea value={formData.heroSubtitle} onChange={set("heroSubtitle")} className="rounded-xl min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>URL Immagine</Label>
                  <Input value={formData.heroImageUrl} onChange={set("heroImageUrl")} className="rounded-xl" />
                  <p className="text-[10px] text-slate-400">Lascia vuoto per l'immagine predefinita.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="features" className="border-none shadow-xl bg-white rounded-xl overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <List className="w-5 h-5 text-secondary" />
                  <span className="text-lg font-bold">Sezione Caratteristiche</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-8 pb-6">
                <div className="grid md:grid-cols-2 gap-4 border-b pb-6">
                  <div className="space-y-2">
                    <Label>Titolo Sezione</Label>
                    <Input value={formData.featuresTitle} onChange={set("featuresTitle")} className="rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sottotitolo Sezione</Label>
                    <Input value={formData.featuresSubtitle} onChange={set("featuresSubtitle")} className="rounded-xl" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="space-y-3 p-4 bg-slate-50 rounded-xl">
                      <div className="font-bold text-primary">Card {num}</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Titolo</Label>
                        <Input
                          value={formData[`feature${num}Title` as keyof ConfigForm]}
                          onChange={set(`feature${num}Title` as keyof ConfigForm)}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrizione</Label>
                        <Textarea
                          value={formData[`feature${num}Desc` as keyof ConfigForm]}
                          onChange={set(`feature${num}Desc` as keyof ConfigForm)}
                          className="rounded-lg text-sm min-h-[80px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="stats" className="border-none shadow-xl bg-white rounded-xl overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  <span className="text-lg font-bold">Sezione Statistiche</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="space-y-3 p-4 bg-slate-50 rounded-xl">
                      <div className="font-bold text-primary text-sm">Dato {num}</div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase">Etichetta</Label>
                        <Input
                          value={formData[`stat${num}Label` as keyof ConfigForm]}
                          onChange={set(`stat${num}Label` as keyof ConfigForm)}
                          className="rounded-lg h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase">Valore</Label>
                        <Input
                          value={formData[`stat${num}Value` as keyof ConfigForm]}
                          onChange={set(`stat${num}Value` as keyof ConfigForm)}
                          className="rounded-lg h-8 text-xs font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 rounded-xl gap-2 px-12 shadow-lg shadow-orange-200"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              Salva Tutte le Modifiche
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
