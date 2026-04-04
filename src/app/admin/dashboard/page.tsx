"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Zap, 
  Database, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  Globe,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  Sparkles,
  AlertTriangle,
  Settings2,
  ListChecks,
  CreditCard,
  MailCheck,
  FileText
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, writeBatch, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRY_SECTORS, INSTITUTE_TYPES } from "@/lib/constants";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.hostname);
    }
  }, []);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    } else if (!isUserLoading && !isProfileLoading && userProfile && userProfile.role !== "Admin") {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, isProfileLoading, userProfile, router]);

  const companiesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "companies");
  }, [db, user]);
  
  const institutesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "institutes");
  }, [db, user]);
  
  const sectorsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "sectors");
  }, [db, user]);

  const typesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "instituteTypes");
  }, [db, user]);
  
  const { data: companies } = useCollection(companiesRef);
  const { data: institutes } = useCollection(institutesRef);
  const { data: sectors } = useCollection(sectorsRef);
  const { data: types } = useCollection(typesRef);

  const stats = {
    companies: companies?.filter(c => !c.isDemo).length || 0,
    institutes: institutes?.filter(i => !i.isDemo).length || 0,
    matches: (companies?.filter(c => !c.isDemo).length || 0) * (institutes?.filter(i => !i.isDemo).length || 0),
    sectors: sectors?.length || 0
  };

  const handleSeedMasterData = async () => {
    if (!db) return;
    setIsSeeding(true);
    const batch = writeBatch(db);

    try {
      INDUSTRY_SECTORS.forEach(s => {
        const sRef = doc(collection(db, "sectors"));
        batch.set(sRef, { name: s });
      });

      INSTITUTE_TYPES.forEach(t => {
        const tRef = doc(collection(db, "instituteTypes"));
        batch.set(tRef, { name: t });
      });

      await batch.commit();
      toast({ title: "Tabelle Inizializzate", description: "Settori e Tipologie sono ora pronti all'uso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile inizializzare le tabelle." });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleGenerateDemoData = async () => {
    if (!db) return;
    
    if (!sectors || sectors.length === 0 || !types || types.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "Tabelle Vuote", 
        description: "Devi prima inizializzare Settori e Tipologie per poter generare i dati demo." 
      });
      return;
    }

    setIsGenerating(true);
    const batch = writeBatch(db);

    try {
      for (let i = 1; i <= 10; i++) {
        const companyId = `demo-company-${i}`;
        const randomSectors = sectors.sort(() => 0.5 - Math.random()).slice(0, 2).map(s => s.name);
        const compRef = doc(db, "companies", companyId);
        batch.set(compRef, {
          id: companyId,
          name: `Azienda Demo ${i} - ${randomSectors[0]}`,
          status: "Approved",
          vatNumber: `IT1234567890${i}`,
          address: `Via delle Imprese ${i}, Milano`,
          website: `https://demo-azienda-${i}.it`,
          sectorIds: randomSectors,
          isDemo: true,
          createdAt: serverTimestamp()
        });
      }

      for (let i = 1; i <= 10; i++) {
        const instId = `demo-institute-${i}`;
        const instType = types[Math.floor(Math.random() * types.length)].name;
        const instRef = doc(db, "institutes", instId);
        batch.set(instRef, {
          id: instId,
          name: `Istituto Demo ${i} - ${instType}`,
          status: "Approved",
          address: `Piazza della Scuola ${i}, Roma`,
          types: [instType],
          isDemo: true,
          createdAt: serverTimestamp()
        });

        for (let j = 1; j <= 10; j++) {
          const cvId = `demo-cv-${i}-${j}`;
          const cvSectors = sectors.sort(() => 0.5 - Math.random()).slice(0, 2).map(s => s.name);
          const cvRef = doc(db, "institutes", instId, "studentCVs", cvId);
          batch.set(cvRef, {
            id: cvId,
            instituteId: instId,
            name: `Studente Demo ${i}${j}`,
            class: "5A Informatica",
            cvInformation: `Profilo di prova per lo studente ${i}${j}. Eccellenti capacità in ${cvSectors.join(" e ")}.`,
            sectorIds: cvSectors,
            isDemo: true,
            createdAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      toast({ title: "Dati Demo Generati", description: "La piattaforma è stata popolata con successo." });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch-write',
          operation: 'create',
          requestResourceData: { type: 'demo-data-batch' }
        }));
      } else {
        toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile generare i dati demo." });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!db) return;
    setIsClearing(true);
    try {
      const batch = writeBatch(db);
      
      const collectionsToClear = ["companies", "institutes"];
      for (const colName of collectionsToClear) {
        const q = query(collection(db, colName), where("isDemo", "==", true));
        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          if (colName === "institutes") {
            const cvSnapshot = await getDocs(collection(db, "institutes", docSnap.id, "studentCVs"));
            cvSnapshot.forEach(cv => batch.delete(cv.ref));
          }
          batch.delete(docSnap.ref);
        }
      }

      await batch.commit();
      toast({ title: "Dati Demo Rimossi", description: "La piattaforma è tornata allo stato originale." });
    } catch (error: any) {
       if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch-delete',
          operation: 'delete'
        }));
      } else {
        toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile rimuovere i dati demo." });
      }
    } finally {
      setIsClearing(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (!user || userProfile?.role !== "Admin") {
    return null;
  }

  const isCustomDomain = currentUrl !== "localhost" && !currentUrl.includes("web.app") && !currentUrl.includes("firebaseapp.com");
  const needsSeeding = (!sectors || sectors.length === 0) || (!types || types.length === 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Dati & SAAS</h1>
              <p className="text-slate-500">Gestisci i dati e monitora la prontezza commerciale.</p>
            </div>
            <div className="bg-primary/10 text-primary p-3 rounded-2xl border border-primary/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          {needsSeeding && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-3xl p-6">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div className="ml-4">
                <AlertTitle className="text-lg font-bold text-red-800">Tabelle Base Mancanti!</AlertTitle>
                <AlertDescription className="text-red-700 mt-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span>I settori merceologici e le tipologie di istituto sono vuoti. Gli utenti non potranno registrarsi correttamente.</span>
                  <Button 
                    onClick={handleSeedMasterData} 
                    disabled={isSeeding}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl gap-2 h-10"
                  >
                    {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    Inizializza Tabelle Ora
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl bg-white overflow-hidden md:col-span-2">
              <div className="bg-secondary p-4 flex items-center gap-3 text-white">
                <ListChecks className="w-5 h-5" />
                <h2 className="font-bold">Checklist Lancio SAAS</h2>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ChecklistItem active={isCustomDomain} icon={<Globe className="w-4 h-4" />} label="Dominio Personalizzato" />
                    <ChecklistItem active={true} icon={<ShieldCheck className="w-4 h-4" />} label="Security Rules Certificate" />
                    <ChecklistItem active={false} icon={<MailCheck className="w-4 h-4" />} label="Email Domain Verified (Resend)" />
                  </div>
                  <div className="space-y-4">
                    <ChecklistItem active={false} icon={<CreditCard className="w-4 h-4" />} label="Stripe Integration (Payments)" />
                    <ChecklistItem active={true} icon={<FileText className="w-4 h-4" />} label="Privacy & Terms GDPR" />
                    <ChecklistItem active={!needsSeeding} icon={<Database className="w-4 h-4" />} label="Master Data Seeded" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden h-full">
              <div className="bg-slate-900 p-4 flex items-center gap-3 text-white">
                <Globe className="w-5 h-5 text-secondary" />
                <h2 className="font-bold">Stato Dominio</h2>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isCustomDomain ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {isCustomDomain ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold">
                      {isCustomDomain ? currentUrl : "Dominio di Prova"}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {isCustomDomain 
                        ? "Collegamento configurato correttamente." 
                        : "Collega un dominio su Aruba per il lancio commerciale."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <AdminStatCard title="Aziende" value={stats.companies} icon={<Building2 className="w-6 h-6" />} color="text-blue-600 bg-blue-50" />
            <AdminStatCard title="Istituti" value={stats.institutes} icon={<Users className="w-6 h-6" />} color="text-green-600 bg-green-50" />
            <AdminStatCard title="Potenziali Match" value={stats.matches} icon={<Zap className="w-6 h-6" />} color="text-orange-600 bg-orange-50" />
            <AdminStatCard title="Settori Attivi" value={stats.sectors} icon={<Database className="w-6 h-6" />} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <div className="bg-primary p-4 flex items-center gap-3 text-white">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h2 className="font-bold">Demo Control Center</h2>
              </div>
              <CardContent className="p-6">
                <p className="text-xs text-slate-500 mb-6">
                  Popola la piattaforma con dati di prova realistici per le tue presentazioni commerciali.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleGenerateDemoData} 
                    disabled={isGenerating || isClearing || needsSeeding}
                    className="bg-secondary hover:bg-secondary/90 text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-orange-100"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Attiva Demo
                  </Button>
                  <Button 
                    onClick={handleClearDemoData} 
                    disabled={isGenerating || isClearing}
                    variant="outline"
                    className="border-red-100 text-red-600 hover:bg-red-50 h-12 rounded-xl gap-2 font-bold"
                  >
                    {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Rimuovi Demo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Ultime Aziende</CardTitle>
                <Link href="/admin/users" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                  Gestione <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies?.slice(0, 3).map((company) => (
                    <div key={company.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-3 items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${company.isDemo ? 'bg-orange-50' : 'bg-blue-50'}`}>
                          <Building2 className={`w-4 h-4 ${company.isDemo ? 'text-orange-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{company.name}</div>
                      </div>
                      {company.isDemo && <Badge className="bg-orange-100 text-orange-600 border-none text-[8px]">DEMO</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChecklistItem({ active, icon, label }: { active: boolean, icon: any, label: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
      <div className={`shrink-0 ${active ? 'text-green-600' : 'text-slate-300'}`}>
        {active ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </div>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

function AdminStatCard({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>
  );
}
