
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Building2, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminChatsPage() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();

  // Carichiamo tutte le chat del sistema
  const chatsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "chats");
  }, [db, user]);

  const { data: chats, isLoading: collectionLoading } = useCollection(chatsRef);

  const isLoading = authLoading || (!!user && collectionLoading);

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
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Chat Globali</h1>
              <p className="text-slate-500">Monitora le conversazioni attive tra Aziende e Istituti.</p>
            </div>
            <div className="bg-secondary text-white p-3 rounded-2xl">
              <MessageSquare className="w-8 h-8" />
            </div>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Azienda (ID)</TableHead>
                  <TableHead>Istituto (ID)</TableHead>
                  <TableHead>Ultimo Messaggio</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats && chats.length > 0 ? (
                  chats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="truncate max-w-[150px]">{chat.companyId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          < GraduationCap className="w-4 h-4 text-secondary" />
                          <span className="truncate max-w-[150px]">{chat.instituteId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500 truncate block max-w-[200px]">
                          {chat.lastMessage || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold" asChild>
                          <Link href={`/dashboard/chat?chatId=${chat.id}`}>
                            Monitora <ArrowRight className="w-3 h-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                      Nessuna chat attiva al momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}
