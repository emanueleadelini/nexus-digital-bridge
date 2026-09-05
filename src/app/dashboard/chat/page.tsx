"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Loader2, MessageSquarePlus } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ChatMessage, UserRole } from "@/types";

function ChatContent() {
  const db = useFirestore();
  const { user } = useAuthGuard();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [newMessage, setNewMessage] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const companiesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "companies");
  }, [db, user]);

  const institutesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "institutes");
  }, [db, user]);

  const { data: companies } = useCollection(companiesRef);
  const { data: institutes } = useCollection(institutesRef);

  const companyNameById = Object.fromEntries((companies || []).map(c => [c.id, c.name as string]));
  const instituteNameById = Object.fromEntries((institutes || []).map(i => [i.id, i.name as string]));

  const targetInstituteId = searchParams.get("institute");
  const targetStudentId = searchParams.get("student");
  const chatIdFromUrl = searchParams.get("chatId");

  // Profilo utente per determinare il ruolo
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile } = useDoc(userProfileRef);
  const role = userProfile?.role as UserRole | undefined;

  // Lista chat filtrata per ruolo (query obbligatoria per sicurezza)
  const chatsRef = useMemoFirebase(() => {
    if (!db || !user || !role) return null;
    if (role === "Admin") return collection(db, "chats");
    const field = role === "Company" ? "companyId" : "instituteId";
    return query(collection(db, "chats"), where(field, "==", user.uid));
  }, [db, user, role]);

  const { data: myChats, isLoading } = useCollection(chatsRef);

  // Real-time listener sui messaggi della chat attiva (subcollection).
  // Solo chat di cui sono parte: in caso di errore permessi, avvisa e resetta.
  useEffect(() => {
    if (!db || !activeChatId) {
      setMessages([]);
      return;
    }
    const messagesRef = collection(db, "chats", activeChatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      },
      () => {
        setMessages([]);
        setActiveChatId(null);
        toast({ variant: "destructive", title: "Accesso negato", description: "Non puoi leggere questa conversazione." });
      }
    );
    return () => unsubscribe();
  }, [db, activeChatId]);

  // Scroll automatico quando arrivano nuovi messaggi
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Selezione automatica / creazione chat da URL params.
  // Il chatId da URL vale solo se e tra le mie chat (anti IDOR).
  const creatingRef = useRef(false);
  useEffect(() => {
    if (isLoading || !myChats) return;

    if (chatIdFromUrl) {
      const mine = myChats.find((c) => c.id === chatIdFromUrl);
      if (mine) {
        setActiveChatId(chatIdFromUrl);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
      return;
    }

    if (targetInstituteId && user && role === "Company") {
      const existing = myChats.find((c) => c.instituteId === targetInstituteId);
      if (existing) {
        setActiveChatId(existing.id);
      } else if (!creatingRef.current) {
        creatingRef.current = true;
        handleCreateNewChat(targetInstituteId, targetStudentId).finally(() => {
          creatingRef.current = false;
        });
      }
    } else if (myChats.length > 0 && !activeChatId && !targetInstituteId) {
      setActiveChatId(myChats[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myChats, isLoading, targetInstituteId, targetStudentId, chatIdFromUrl, role]);

  const handleCreateNewChat = async (instId: string, studentId: string | null) => {
    if (!db || !user) return;
    setIsCreatingChat(true);
    try {
      const newChatRef = await addDoc(collection(db, "chats"), {
        companyId: user.uid,
        instituteId: instId,
        studentCVId: studentId || null,
        lastMessage: "Conversazione avviata.",
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setActiveChatId(newChatRef.id);
      toast({ title: "Chat avviata", description: "Ora puoi dialogare con l'istituto." });
    } catch {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile avviare la chat." });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !db || !user || !role) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      // Batch atomico: messaggio + metadati chat, o niente (niente duplicati al retry).
      const batch = writeBatch(db);
      batch.set(doc(collection(db, "chats", activeChatId, "messages")), {
        senderId: user.uid,
        senderEmail: user.email ?? "",
        senderRole: role,
        text,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "chats", activeChatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid,
      });
      await batch.commit();
    } catch {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile inviare il messaggio." });
      setNewMessage(text);
    }
  };

  const activeChat = myChats?.find((c) => c.id === activeChatId);

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

        {/* Sidebar lista chat */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-headline font-bold text-primary">
              {role === "Admin" ? "Tutte le Chat" : "Conversazioni"}
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {myChats
              ?.slice()
              .sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0))
              .map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 ${
                    activeChatId === chat.id ? "bg-blue-50 border-r-4 border-r-primary" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://picsum.photos/seed/${chat.id}/100/100`} />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">
                        {role === "Company"
                          ? (instituteNameById[chat.instituteId] || "Istituto Partner")
                          : role === "Institute"
                          ? (companyNameById[chat.companyId] || "Azienda Interessata")
                          : `${companyNameById[chat.companyId] || chat.companyId?.slice(0, 8)} ↔ ${instituteNameById[chat.instituteId] || chat.instituteId?.slice(0, 8)}`}
                      </span>
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

        {/* Area messaggi */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Header chat */}
            <div className="h-20 bg-white border-b flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://picsum.photos/seed/${activeChat.id}/100/100`} />
                  <AvatarFallback>CH</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-primary">
                    {role === "Company"
                      ? (instituteNameById[activeChat.instituteId] || "Istituto Partner")
                      : role === "Institute"
                      ? (companyNameById[activeChat.companyId] || "Azienda Interessata")
                      : "Monitoraggio Admin"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeChat.studentCVId
                      ? "Oggetto: Interesse Profilo Studente"
                      : "Conversazione Generale"}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Phone className="w-5 h-5" />
              </Button>
            </div>

            {/* Lista messaggi */}
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
                  const isMine = msg.senderId === user?.uid;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[70%] ${
                        isMine ? "items-end self-end" : "items-start"
                      }`}
                    >
                      <div className="text-[9px] text-slate-400 mb-1 px-2">{msg.senderEmail}</div>
                      <div
                        className={`p-4 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? "bg-white rounded-tr-none"
                            : "bg-primary text-white rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 px-2">
                        {msg.createdAt?.toDate
                          ? format(msg.createdAt.toDate(), "HH:mm", { locale: it })
                          : ""}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input messaggio — nascosto per Admin (solo monitoraggio) */}
            {role !== "Admin" && (
              <form onSubmit={handleSendMessage} className="p-6 bg-white border-t">
                <div className="flex gap-4">
                  <Input
                    className="rounded-xl bg-slate-50 border-none h-12"
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-secondary hover:bg-secondary/90 text-white rounded-xl h-12 w-12 p-0"
                  >
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
