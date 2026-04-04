
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp, Users, MessageSquare, Newspaper, Layout, Building2, GraduationCap, Zap } from "lucide-react";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

const weeklyData = [
  { giorno: "Lun", aziende: 2, istituti: 1, chat: 3 },
  { giorno: "Mar", aziende: 1, istituti: 3, chat: 5 },
  { giorno: "Mer", aziende: 4, istituti: 2, chat: 8 },
  { giorno: "Gio", aziende: 2, istituti: 4, chat: 6 },
  { giorno: "Ven", aziende: 5, istituti: 2, chat: 11 },
  { giorno: "Sab", aziende: 1, istituti: 1, chat: 4 },
  { giorno: "Dom", aziende: 3, istituti: 2, chat: 7 },
];

export default function AdminPanoramicaPage() {
  const db = useFirestore();
  const { user } = useUser();

  const companiesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "companies"), where("isDemo", "!=", true));
  }, [db, user]);

  const institutesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "institutes"), where("isDemo", "!=", true));
  }, [db, user]);

  const chatsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "chats");
  }, [db, user]);

  const { data: companies } = useCollection(companiesRef);
  const { data: institutes } = useCollection(institutesRef);
  const { data: chats } = useCollection(chatsRef);

  const stats = useMemo(() => ({
    companies: companies?.length || 0,
    institutes: institutes?.length || 0,
    chats: chats?.length || 0,
    pendingCompanies: companies?.filter(c => c.status === "Pending").length || 0,
    pendingInstitutes: institutes?.filter(i => i.status === "Pending").length || 0,
  }), [companies, institutes, chats]);

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

          {/* Stat Cards reali */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Aziende" value={stats.companies} sub={`${stats.pendingCompanies} in attesa`} icon={<Building2 className="w-5 h-5" />} color="text-blue-600 bg-blue-50" />
            <StatCard title="Istituti" value={stats.institutes} sub={`${stats.pendingInstitutes} in attesa`} icon={<GraduationCap className="w-5 h-5" />} color="text-green-600 bg-green-50" />
            <StatCard title="Conversazioni" value={stats.chats} sub="chat attive totali" icon={<MessageSquare className="w-5 h-5" />} color="text-orange-600 bg-orange-50" />
            <StatCard title="Approvazioni" value={stats.pendingCompanies + stats.pendingInstitutes} sub="da gestire" icon={<Zap className="w-5 h-5" />} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <QuickActionCard
              title="Gestione Utenti"
              desc="Verifica profili e approvazioni"
              href="/admin/users"
              icon={<Users className="w-6 h-6" />}
              color="bg-blue-500"
            />
            <QuickActionCard
              title="Blog & News"
              desc="Pubblica articoli e annunci"
              href="/admin/blog"
              icon={<Newspaper className="w-6 h-6" />}
              color="bg-orange-500"
            />
            <QuickActionCard
              title="Landing Page"
              desc="Aggiorna testi e immagini"
              href="/admin/content"
              icon={<Layout className="w-6 h-6" />}
              color="bg-purple-500"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Andamento Settimanale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAziende" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorChat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="giorno" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
                    <Area type="monotone" dataKey="aziende" name="Aziende" stroke="#1e40af" strokeWidth={2} fill="url(#colorAziende)" dot={false} />
                    <Area type="monotone" dataKey="chat" name="Chat" stroke="#f97316" strokeWidth={2} fill="url(#colorChat)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-primary text-white">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest font-bold opacity-80">Chat Totali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold font-headline">{stats.chats}</div>
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
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">Database Firestore: Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">AI Gemini (CV Parser): Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">Email Service (Resend): Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">Auth Firebase: Online</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
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
