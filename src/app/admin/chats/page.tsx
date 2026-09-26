
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Building2, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useApiData } from "@/lib/api";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Chat } from "@/types";

export default function AdminChatsPage() {
  const { data: chats, isLoading } = useApiData<Chat[]>("/api/admin/chats", 15_000);

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
              <p className="text-slate-500">Monitora le conversazioni attive tra Aziende e Istituti (sola lettura).</p>
            </div>
            <div className="bg-secondary text-white p-3 rounded-2xl">
              <MessageSquare className="w-8 h-8" />
            </div>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Istituto</TableHead>
                  <TableHead>Ultimo Messaggio</TableHead>
                  <TableHead>Messaggi</TableHead>
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
                          <span className="truncate max-w-[150px]">{chat.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <GraduationCap className="w-4 h-4 text-secondary" />
                          <span className="truncate max-w-[150px]">{chat.instituteName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500 truncate block max-w-[200px]">
                          {chat.lastMessage || "—"}
                        </span>
                        {chat.lastMessageAt && (
                          <span className="text-[10px] text-slate-400">
                            {format(new Date(chat.lastMessageAt), "d MMM HH:mm", { locale: it })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-primary border-none">{chat.messageCount}</Badge>
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
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
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
