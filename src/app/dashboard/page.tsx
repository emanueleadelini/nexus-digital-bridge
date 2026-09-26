"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, MessageSquare, TrendingUp, Bell, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthGuard, useApiData, apiFetch } from "@/lib/api";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Chat, AppNotification, StudentCV } from "@/types";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardOverview() {
  const { user, profile, isLoading } = useAuthGuard();

  const role = user?.role?.toLowerCase() as "company" | "institute" | undefined;
  const sectorIds: string[] = (profile?.sectorIds as string[] | undefined) || [];

  const { data: myChats } = useApiData<Chat[]>(user ? "/api/chats" : null);
  const { data: notifications, refetch: refetchNotifs } = useApiData<AppNotification[]>(
    user ? "/api/notifications" : null,
    15_000
  );
  const { data: myStudents } = useApiData<StudentCV[]>(
    user?.role === "Institute" ? "/api/students" : null
  );

  const chatsCount = myChats?.length || 0;
  const studentsCount = myStudents?.length || 0;
  const unread = notifications?.filter((n) => !n.readAt) || [];

  const recentChats = (myChats || []).slice(0, 3);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user?.status === "Approved") {
      const dismissed = localStorage.getItem("onboarding_dismissed");
      if (dismissed !== "true") setShowWelcome(true);
    }
  }, [user]);

  function handleDismissWelcome() {
    localStorage.setItem("onboarding_dismissed", "true");
    setShowWelcome(false);
  }

  async function openNotifs() {
    setShowNotifs((v) => !v);
    if (!showNotifs && unread.length > 0) {
      await apiFetch("/api/notifications", { method: "POST" });
      refetchNotifs(true);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            <div className="h-10 w-64 bg-slate-200 rounded-xl" />
            <div className="grid md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {showWelcome && (
            <div className="relative bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <button onClick={handleDismissWelcome} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors" aria-label="Chiudi benvenuto">
                <X className="w-5 h-5" />
              </button>
              <div className="relative z-10 space-y-4">
                <h2 className="text-2xl font-headline font-bold">Benvenuto su Nexus Digital Bridge! 🎉</h2>
                <p className="text-blue-100 text-sm">Segui questi passi per iniziare al meglio:</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {(role === "company"
                    ? ["1. Completa il profilo azienda", "2. Esplora i Match", "3. Contatta un Istituto"]
                    : ["1. Completa il profilo istituto", "2. Carica i CV degli studenti", "3. Aspetta le aziende interessate"]
                  ).map((step, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl px-4 py-3 text-sm font-medium">{step}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Panoramica Dashboard</h1>
              <p className="text-slate-500">
                Benvenuto su Nexus Digital Bridge.{" "}
                {role === "company" ? "Ecco un riassunto delle tue attività." : "Ecco lo stato dei tuoi studenti e match."}
              </p>
            </div>
            <div className="relative">
              <Button variant="outline" onClick={openNotifs} className="rounded-xl border-slate-200 bg-white gap-2 shadow-sm relative">
                <Bell className="w-4 h-4 text-primary" />
                Notifiche
                {unread.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread.length}
                  </span>
                )}
              </Button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-auto bg-white border rounded-2xl shadow-2xl z-50 p-2">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 10).map((n) => (
                      <Link key={n.id} href={n.link || "#"} className="block p-3 rounded-xl hover:bg-slate-50">
                        <div className="text-sm font-bold text-primary">{n.title}</div>
                        <div className="text-xs text-slate-500">{n.body}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {n.createdAt ? format(new Date(n.createdAt), "d MMM, HH:mm", { locale: it }) : ""}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-6">Nessuna notifica</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              title={role === "company" ? "Conversazioni Attive" : "Aziende Contattate"}
              value={chatsCount}
              icon={<MessageSquare className="w-6 h-6" />}
              color="text-orange-600 bg-orange-50"
            />
            <StatCard
              title={role === "company" ? "Messaggi Scambiati" : "Studenti Registrati"}
              value={role === "company" ? myChats?.reduce((a, c) => a + (c.messageCount || 0), 0) || 0 : studentsCount}
              icon={<Users className="w-6 h-6" />}
              color="text-blue-600 bg-blue-50"
            />
            <StatCard
              title="Settori Attivi"
              value={sectorIds.length}
              icon={<TrendingUp className="w-6 h-6" />}
              color="text-green-600 bg-green-50"
            />
            <StatCard
              title={role === "company" ? "Match Trovati" : "Match Attivi"}
              value={role === "company" ? chatsCount : studentsCount > 0 ? studentsCount : "—"}
              icon={<Zap className="w-6 h-6" />}
              color="text-purple-600 bg-purple-50"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Conversazioni Recenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentChats.length > 0 ? (
                    recentChats.map((chat) => (
                      <Link key={chat.id} href="/dashboard/chat" className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {role === "company" ? (
                            <Zap className="w-5 h-5 text-primary" />
                          ) : (
                            <Building2 className="w-5 h-5 text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-bold">
                            {role === "company" ? chat.instituteName || "Istituto partner" : chat.companyName || "Azienda interessata"}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {chat.lastMessage || "Conversazione avviata"}
                          </p>
                          <div className="text-[10px] text-slate-400">
                            {chat.lastMessageAt
                              ? format(new Date(chat.lastMessageAt), "d MMM, HH:mm", { locale: it })
                              : "..."}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nessuna conversazione ancora. Inizia a esplorare i match!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  {role === "company" ? "I Tuoi Settori" : "Indirizzi di Studio"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectorIds.length > 0 ? (
                  sectorIds.slice(0, 5).map((sector) => (
                    <div key={sector} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-sm font-medium text-slate-700 truncate">{sector}</span>
                      <div className="ml-auto text-xs text-primary font-bold">Attivo</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Nessun settore configurato. Aggiorna il tuo profilo.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="border-none shadow-lg bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
        </div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-sm text-slate-500">{title}</div>
      </CardContent>
    </Card>
  );
}
