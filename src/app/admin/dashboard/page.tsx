
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
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApiData, apiFetch } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { UserProfile } from "@/types";

interface Named { id: string; name: string }
interface AdminStats { companies: number; institutes: number; students: number; chats: number; messages: number; pendingUsers: number }

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setCurrentUrl(window.location.hostname);
  }, []);

  const { data: stats } = useApiData<AdminStats>("/api/admin/stats", 30_000);
  const { data: users } = useApiData<UserProfile[]>("/api/admin/users", 30_000);
  const { data: sectors, refetch: refetchSectors } = useApiData<Named[]>("/api/admin/sectors");
  const { data: types, refetch: refetchTypes } = useApiData<Named[]>("/api/admin/institute-types");

  const latestCompanies = (users || []).filter(u => u.role === "Company").slice(0, 5);
  const needsSeeding = (sectors?.length || 0) === 0 || (types?.length || 0) === 0;

  const handleSeedMasterData = async () => {
    setIsSeeding(true);
    const res = await apiFetch("/api/admin/seed", { method: "POST" });
    setIsSeeding(false);
    if (res.ok) {
      const d = res.data as { addedSectors: number; addedTypes: number };
      toast({ title: "Tabelle Inizializzate", description: `${d.addedSectors} settori + ${d.addedTypes} tipologie aggiunte.` });
      refetchSectors(true);
      refetchTypes(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile inizializzare le tabelle." });
    }
  };

  const handleGenerateDemoData = async () => {
    if (needsSeeding) {
      toast({ variant: "destructive", title: "Tabelle Vuote", description: "Inizializza prima Settori e Tipologie." });
      return;
    }
    setIsGenerating(true);
    const res = await apiFetch("/api/admin/demo", { method: "POST" });
    setIsGenerating(false);
    if (res.ok) {
      toast({ title: "Dati Demo Generati", description: "10 aziende, 10 istituti e 100 CV demo creati." });
    } else {
      toast({ variant: "destructive", title: "Errore", description: (res.data as { error?: string }).error || "Impossibile generare i dati demo." });
    }
  };

  const handleClearDemoData = async () => {
    setIsClearing(true);
    const res = await apiFetch("/api/admin/demo", { method: "DELETE" });
    setIsClearing(false);
    if (res.ok) {
      toast({ title: "Dati Demo Rimossi", description: "La piattaforma è tornata allo stato originale." });
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile rimuovere i dati demo." });
    }
  };

  const isCustomDomain = currentUrl.includes("nexusdigitalbridge.it");

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
                    <ChecklistItem active={true} icon={<ShieldCheck className="w-4 h-4" />} label="Auth server-side (Better Auth)" />
                    <ChecklistItem active={true} icon={<Database className="w-4 h-4" />} label="PostgreSQL self-hosted" />
                  </div>
                  <div className="space-y-4">
                    <ChecklistItem active={true} icon={<FileText className="w-4 h-4" />} label="Privacy & Terms GDPR" />
                    <ChecklistItem active={!needsSeeding} icon={<Database className="w-4 h-4" />} label="Master Data Seeded" />
                    <ChecklistItem active={true} icon={<ShieldCheck className="w-4 h-4" />} label="PDF CV su volume locale" />
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
                    <div className="text-sm font-bold">{isCustomDomain ? currentUrl : "Ambiente di test"}</div>
                    <p className="text-[10px] text-slate-500">
                      {isCustomDomain ? "Dominio configurato correttamente." : "In produzione sarà nexusdigitalbridge.it."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <AdminStatCard title="Aziende" value={stats?.companies ?? 0} icon={<Building2 className="w-6 h-6" />} color="text-blue-600 bg-blue-50" />
            <AdminStatCard title="Istituti" value={stats?.institutes ?? 0} icon={<Users className="w-6 h-6" />} color="text-green-600 bg-green-50" />
            <AdminStatCard title="CV Studenti" value={stats?.students ?? 0} icon={<Zap className="w-6 h-6" />} color="text-orange-600 bg-orange-50" />
            <AdminStatCard title="Settori Attivi" value={sectors?.length ?? 0} icon={<Database className="w-6 h-6" />} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <div className="bg-primary p-4 flex items-center gap-3 text-white">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h2 className="font-bold">Demo Control Center</h2>
              </div>
              <CardContent className="p-6">
                <p className="text-xs text-slate-500 mb-6">
                  Popola la piattaforma con dati di prova realistici per le presentazioni commerciali.
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
                  {latestCompanies.map((company) => (
                    <div key={company.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{company.name}</div>
                      </div>
                      <Badge className={`border-none text-[8px] ${company.status === "Approved" ? "bg-green-100 text-green-700" : company.status === "Pending" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
                        {company.status}
                      </Badge>
                    </div>
                  ))}
                  {latestCompanies.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nessuna azienda registrata.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChecklistItem({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
      <div className={`shrink-0 ${active ? 'text-green-600' : 'text-slate-300'}`}>
        {active ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </div>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

function AdminStatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
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
