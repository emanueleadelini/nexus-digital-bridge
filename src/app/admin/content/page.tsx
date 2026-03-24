
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Layout, Save, Image as ImageIcon, Loader2, List, BarChart3 } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AdminContentPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "config", "landingPage");
  }, [db]);

  const { data: config, isLoading } = useDoc(configRef);

  const heroPlaceholder = PlaceHolderImages.find(img => img.id === 'hero-bg');

  const [formData, setFormData] = useState({
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    featuresTitle: "",
    featuresSubtitle: "",
    feature1Title: "",
    feature1Desc: "",
    feature2Title: "",
    feature2Desc: "",
    feature3Title: "",
    feature3Desc: "",
    stat1Label: "",
    stat1Value: "",
    stat2Label: "",
    stat2Value: "",
    stat3Label: "",
    stat3Value: "",
    stat4Label: "",
    stat4Value: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        heroTitle: config.heroTitle || "Il Ponte Digitale tra Talento e Opportunità",
        heroSubtitle: config.heroSubtitle || "Colleghiamo Istituti Scolastici e Aziende attraverso un sistema di matching intelligente basato sui settori merceologici reali.",
        heroImageUrl: config.heroImageUrl || heroPlaceholder?.imageUrl || "https://picsum.photos/seed/nexus1/800/800",
        featuresTitle: config.featuresTitle || "Un'ecosistema costruito per il valore",
        featuresSubtitle: config.featuresSubtitle || "Abbiamo creato strumenti specifici per ogni attore del sistema scolastico-produttivo.",
        feature1Title: config.feature1Title || "Per le Aziende",
        feature1Desc: config.feature1Desc || "Accedi a un database di profili studenti filtrati per settori merceologici affini alla tua attività. Inizia conversazioni dirette con gli istituti.",
        feature2Title: config.feature2Title || "Per gli Istituti",
        feature2Desc: config.feature2Desc || "Valorizza il percorso dei tuoi studenti caricando i loro CV. Ricevi notifiche quando un'azienda mostra interesse per i tuoi profili.",
        feature3Title: config.feature3Title || "Matching Intelligente",
        feature3Desc: config.feature3Desc || "Il nostro algoritmo analizza i settori merceologici Confindustria per suggerire le connessioni più promettenti tra domanda e offerta.",
        stat1Label: config.stat1Label || "Aziende Iscritte",
        stat1Value: config.stat1Value || "450+",
        stat2Label: config.stat2Label || "Istituti Partner",
        stat2Value: config.stat2Value || "120+",
        stat3Label: config.stat3Label || "CV Studenti",
        stat3Value: config.stat3Value || "8,500+",
        stat4Label: config.stat4Label || "Conversazioni",
        stat4Value: config.stat4Value || "15k",
      });
    }
  }, [config, heroPlaceholder]);

  const handleSave = () => {
    if (!configRef) return;

    setIsSaving(true);
    setDoc(configRef, formData, { merge: true })
      .then(() => {
        toast({
          title: "Contenuti aggiornati",
          description: "La landing page è stata aggiornata con successo.",
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: configRef.path,
          operation: "write",
          requestResourceData: formData,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar role="admin" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar role="admin" />
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
            {/* HERO SECTION */}
            <AccordionItem value="hero" className="border-none shadow-xl bg-white rounded-xl overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-secondary" />
                  <span className="text-lg font-bold">Sezione Hero (Copertina)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Titolo Principale</Label>
                  <Input 
                    id="heroTitle" 
                    value={formData.heroTitle}
                    onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Sottotitolo</Label>
                  <Textarea 
                    id="heroSubtitle" 
                    value={formData.heroSubtitle}
                    onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImageUrl">URL Immagine</Label>
                  <Input 
                    id="heroImageUrl" 
                    value={formData.heroImageUrl}
                    onChange={(e) => setFormData({...formData, heroImageUrl: e.target.value})}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">Lascia vuoto per usare l'immagine predefinita "Scuola-Azienda".</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* FEATURES SECTION */}
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
                    <Input value={formData.featuresTitle} onChange={(e) => setFormData({...formData, featuresTitle: e.target.value})} className="rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sottotitolo Sezione</Label>
                    <Input value={formData.featuresSubtitle} onChange={(e) => setFormData({...formData, featuresSubtitle: e.target.value})} className="rounded-xl" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="space-y-3 p-4 bg-slate-50 rounded-xl">
                      <div className="font-bold text-primary">Card {num}</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Titolo</Label>
                        <Input 
                          value={formData[`feature${num}Title` as keyof typeof formData]} 
                          onChange={(e) => setFormData({...formData, [`feature${num}Title`]: e.target.value})} 
                          className="rounded-lg h-9 text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrizione</Label>
                        <Textarea 
                          value={formData[`feature${num}Desc` as keyof typeof formData]} 
                          onChange={(e) => setFormData({...formData, [`feature${num}Desc`]: e.target.value})} 
                          className="rounded-lg text-sm min-h-[80px]" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* STATS SECTION */}
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
                          value={formData[`stat${num}Label` as keyof typeof formData]} 
                          onChange={(e) => setFormData({...formData, [`stat${num}Label`]: e.target.value})} 
                          className="rounded-lg h-8 text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase">Valore</Label>
                        <Input 
                          value={formData[`stat${num}Value` as keyof typeof formData]} 
                          onChange={(e) => setFormData({...formData, [`stat${num}Value`]: e.target.value})} 
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
