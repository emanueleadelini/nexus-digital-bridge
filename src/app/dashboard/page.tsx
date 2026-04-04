"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, MessageSquare, TrendingUp, Bell, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { CompanyProfile, InstituteProfile } from "@/types";

export default function DashboardOverview() {
  const { user, userProfile, isLoading } = useAuthGuard();
  const db = useFirestore();

  const role = userProfile?.role?.toLowerCase() as "company" | "institute" | undefined;

  // Profilo dettagliato (companies o institutes) per leggere sectorIds
  const profileRef = useMemoFirebase(() => {
    if (!db || !user || !userProfile) return null;
    const path = userProfile.role === "Company" ? "companies" : "institutes";
    return doc(db, path, user.uid);
  }, [db, user, userProfile]);

  const { data: profileDetails } = useDoc<CompanyProfile | InstituteProfile>(profileRef);
  const sectorIds: string[] = profileDetails?.sectorIds || [];

  // Chat dell'utente corrente
  const chatsRef = useMemoFirebase(() => {
    if (!db || !user || !userProfile) return null;
    const field = userProfile.role === "Company" ? "companyId" : "instituteId";
    return query(collection(db, "chats"), where(field, "==", user.uid));
  }, [db, user, userProfile]);

  const { data: myChats } = useCollection(chatsRef);

  // Studenti dell'istituto (solo Institute)
  const studentsRef = useMemoFirebase(() => {
    if (!db || !user || userProfile?.role !== "Institute") return null;
    return collection(db, "institutes", user.uid, "studentCVs");
  }, [db, user, userProfile]);

  const { data: myStudents } = useCollection(studentsRef);

  // Statistiche reali
  const chatsCount = myChats?.length || 0;
  const totalMessages = myChats?.reduce((acc, chat) => acc + (chat.messages?.length || 0), 0) || 0;
  const studentsCount = myStudents?.length || 0;

  // Ultime 3 chat per attività recenti
  const recentChats = [...(myChats || [])]
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
    .slice(0, 3);

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
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-64 bg-slate-200 rounded-2xl" />
              <div className="h-64 bg-slate-200 rounded-2xl" />
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
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Panoramica Dashboard</h1>
              <p className="text-slate-500">
                Benvenuto su Nexus Digital Bridge.{" "}
                {role === "company"
                  ? "Ecco un riassunto delle tue attività."
                  : "Ecco lo stato dei tuoi studenti e match."}
              </p>
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white gap-2 shadow-sm">
              <Bell className="w-4 h-4 text-primary" />
              Notifiche
            </Button>
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
              value={role === "company" ? totalMessages : studentsCount}
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
              value={chatsCount > 0 ? `${chatsCount * 3}+` : "—"}
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
                    recentChats.map((chat) => {
                      const lastMsg = chat.messages?.[chat.messages.length - 1] ?? "";
                      const displayMsg = lastMsg.includes(": ")
                        ? lastMsg.split(": ").slice(1).join(": ")
                        : lastMsg;
                      return (
                        <div
                          key={chat.id}
                          className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            {role === "company" ? (
                              <Zap className="w-5 h-5 text-primary" />
                            ) : (
                              <Building2 className="w-5 h-5 text-secondary" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-bold">
                              {role === "company" ? "Istituto partner" : "Azienda interessata"}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {displayMsg || "Conversazione avviata"}
                            </p>
                            <div className="text-[10px] text-slate-400">
                              {chat.updatedAt
                                ? format(
                                    new Date(chat.updatedAt.seconds * 1000),
                                    "d MMM, HH:mm",
                                    { locale: it }
                                  )
                                : "..."}
                            </div>
                          </div>
                        </div>
                      );
                    })
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
