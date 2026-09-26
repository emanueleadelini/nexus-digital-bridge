
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp, Users, MessageSquare, Newspaper, Layout, Building2, GraduationCap, Zap } from "lucide-react";
import Link from "next/link";
import { useApiData } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AdminStats {
  companies: number;
  institutes: number;
  students: number;
  chats: number;
  messages: number;
  pendingUsers: number;
}

export default function AdminPanoramicaPage() {
  const { data: stats } = useApiData<AdminStats>("/api/admin/stats", 30_000);
  const { data: health } = useApiData<{ db?: string; ai?: string }>("/api/health", 60_000);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Panoramica Piattaforma</h1>
              <p className="text-slate-500">Benvenuto nella console di controllo. Ecco cosa succede su Nexus.</p>
            </div>
            <div className="bg-slate-900 text-white p-3 rounded-2xl">
              <Globe className="w-8 h-8 text-secondary" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Aziende" value={stats?.companies ?? 0} sub="iscritte reali" icon={<Building2 className="w-5 h-5" />} color="text-blue-600 bg-blue-50" />
            <StatCard title="Istituti" value={stats?.institutes ?? 0} sub="iscritti reali" icon={<GraduationCap className="w-5 h-5" />} color="text-green-600 bg-green-50" />
            <StatCard title="CV Studenti" value={stats?.students ?? 0} sub="profili caricati" icon={<Users className="w-5 h-5" />} color="text-blue-600 bg-blue-50" />
            <StatCard title="Approvazioni" value={stats?.pendingUsers ?? 0} sub="da gestire" icon={<Zap className="w-5 h-5" />} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <QuickActionCard title="Gestione Utenti" desc="Verifica profili e approvazioni" href="/admin/users" icon={<Users className="w-6 h-6" />} color="bg-blue-500" />
            <QuickActionCard title="Blog & News" desc="Pubblica articoli e annunci" href="/admin/blog" icon={<Newspaper className="w-6 h-6" />} color="bg-orange-500" />
            <QuickActionCard title="Landing Page" desc="Aggiorna testi e immagini" href="/admin/content" icon={<Layout className="w-6 h-6" />} color="bg-purple-500" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Conversazioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-8 py-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold font-headline text-primary">{stats?.chats ?? 0}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Chat attive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold font-headline text-secondary">{stats?.messages ?? 0}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Messaggi totali</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-primary text-white">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest font-bold opacity-80">Chat Totali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold font-headline">{stats?.chats ?? 0}</div>
                    <MessageSquare className="w-12 h-12 text-secondary opacity-30" />
                  </div>
                  <p className="text-xs mt-4 text-blue-100">Conversazioni aziende ↔ istituti</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Stato Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatusRow ok={health?.db === "ok"} label="Database PostgreSQL" />
                  <StatusRow ok={health?.ai === "ok"} label="AI Parser (llama-swap)" />
                  <StatusRow ok={true} label="Auth (Better Auth + Postgres)" />
                  <StatusRow ok={true} label="Email (SMTP self-hosted)" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${ok ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      <span className="text-xs font-medium text-slate-600">{label}: {ok ? "Online" : "Offline"}</span>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: { title: string; value: number; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-5">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-xs font-bold text-slate-700 mt-0.5">{title}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ title, desc, href, icon, color }: { title: string; desc: string; href: string; icon: React.ReactNode; color: string }) {
  return (
    <Link href={href}>
      <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
