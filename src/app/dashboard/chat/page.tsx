"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquarePlus } from "lucide-react";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ChatMessage, Chat } from "@/types";
import { useAuthGuard, useApiData, apiFetch } from "@/lib/api";

function ChatContent() {
  const { user } = useAuthGuard();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [newMessage, setNewMessage] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgCount = useRef(0);

  const role = user?.role;

  const { data: myChats, isLoading, refetch: refetchChats } = useApiData<Chat[]>(
    user ? "/api/chats" : null,
    5_000 // polling: sostituisce il listener Firestore
  );

  const targetInstituteId = searchParams.get("institute");
  const targetStudentId = searchParams.get("student");
  const chatIdFromUrl = searchParams.get("chatId");

  // Poll messaggi della chat attiva
  const loadMessages = useCallback(async (silent = true) => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, { credentials: "include" });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages((prev) => (data.length !== prev.length || data.at(-1)?.id !== prev.at(-1)?.id ? data : prev));
      }
    } catch { /* polling tollerante */ }
  }, [activeChatId]);

  useEffect(() => {
    loadMessages(false);
    const t = setInterval(() => loadMessages(true), 3_000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > lastMsgCount.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMsgCount.current = messages.length;
  }, [messages]);

  // Selezione automatica / creazione chat da URL params
  useEffect(() => {
    if (isLoading || !myChats || !role) return;

    if (chatIdFromUrl) {
      setActiveChatId(chatIdFromUrl);
      return;
    }

    if (targetInstituteId && user && role === "Company") {
      const existing = myChats.find((c) => c.instituteId === targetInstituteId);
      if (existing) {
        setActiveChatId(existing.id);
      } else if (!isCreatingChat) {
        handleCreateNewChat(targetInstituteId, targetStudentId);
      }
    } else if (myChats.length > 0 && !activeChatId && !targetInstituteId) {
      setActiveChatId(myChats[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myChats, isLoading, targetInstituteId, targetStudentId, chatIdFromUrl, role]);

  const handleCreateNewChat = async (instId: string, studentId: string | null) => {
    setIsCreatingChat(true);
    const res = await apiFetch("/api/chats", {
      json: { instituteId: instId, studentCvId: studentId || undefined },
    });
    if (res.ok) {
      const chat = res.data as Chat;
      setActiveChatId(chat.id);
      toast({ title: "Chat avviata", description: "Ora puoi dialogare con l'istituto." });
      refetchChats(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: (res.data as { error?: string }).error || "Impossibile avviare la chat." });
    }
    setIsCreatingChat(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeChatId || !user) return;
    setNewMessage("");

    const res = await apiFetch(`/api/chats/${activeChatId}/messages`, { json: { text } });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile inviare il messaggio." });
      setNewMessage(text);
    } else {
      loadMessages(true);
      refetchChats(true);
    }
  };

  const activeChat = myChats?.find((c) => c.id === activeChatId);

  const chatLabel = (chat: Chat) =>
    role === "Company"
      ? chat.instituteName || "Istituto Partner"
      : role === "Institute"
      ? chat.companyName || "Azienda Interessata"
      : `${chat.companyName || "?"} ↔ ${chat.instituteName || "?"}`;

  if (isLoading || !role) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">

        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-headline font-bold text-primary">
              {role === "Admin" ? "Tutte le Chat" : "Conversazioni"}
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {myChats?.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 ${
                  activeChatId === chat.id ? "bg-blue-50 border-r-4 border-r-primary" : ""
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {chatLabel(chat).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm block truncate">{chatLabel(chat)}</span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {chat.lastMessage || "Conversazione avviata"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!myChats || myChats.length === 0) && (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nessuna conversazione attiva.
              </div>
            )}
          </ScrollArea>
        </div>

        {activeChat ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            <div className="h-20 bg-white border-b flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {chatLabel(activeChat).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-primary">{chatLabel(activeChat)}</div>
                  <div className="text-xs text-slate-500">
                    {activeChat.studentCvId ? "Oggetto: Interesse Profilo Studente" : "Conversazione Generale"}
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-8">
              <div className="flex flex-col gap-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-[10px] bg-slate-200 text-slate-500 px-3 py-1 rounded-full uppercase font-bold">
                      Conversazione avviata — scrivi il primo messaggio
                    </span>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMine ? "items-end self-end" : "items-start"}`}>
                      <div className="text-[9px] text-slate-400 mb-1 px-2">{msg.senderEmail}</div>
                      <div className={`p-4 rounded-2xl text-sm shadow-sm ${isMine ? "bg-white rounded-tr-none" : "bg-primary text-white rounded-tl-none"}`}>
                        {msg.text}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 px-2">
                        {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm", { locale: it }) : ""}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {role !== "Admin" && (
              <form onSubmit={handleSendMessage} className="p-6 bg-white border-t">
                <div className="flex gap-4">
                  <Input
                    className="rounded-xl bg-slate-50 border-none h-12"
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-secondary hover:bg-secondary/90 text-white rounded-xl h-12 w-12 p-0">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 space-y-4">
            <div className="bg-white p-6 rounded-full shadow-xl">
              <MessageSquarePlus className="w-12 h-12 text-blue-100" />
            </div>
            <p className="font-medium">Seleziona una chat per iniziare a collaborare.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </div>
  );
}
