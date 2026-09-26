import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { getChatById, canAccessChat, getMessages, addMessage } from "@/server/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const chat = await getChatById(id);
  if (!chat) return NextResponse.json({ error: "Chat non trovata" }, { status: 404 });
  if (!canAccessChat(chat, user.id, user.role)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  return NextResponse.json(await getMessages(id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;

  // Admin e' audit read-only: non puo' scrivere nelle chat
  if (user.role === "Admin") {
    return NextResponse.json({ error: "Admin solo lettura" }, { status: 403 });
  }

  const chat = await getChatById(id);
  if (!chat) return NextResponse.json({ error: "Chat non trovata" }, { status: 404 });
  if (!canAccessChat(chat, user.id, user.role)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { text } = (await req.json()) as { text?: string };
  const clean = String(text || "").trim();
  if (!clean || clean.length > 4000) {
    return NextResponse.json({ error: "Messaggio non valido" }, { status: 400 });
  }

  const msgId = await addMessage({
    chatId: id,
    senderId: user.id,
    senderEmail: user.email,
    senderRole: user.role,
    text: clean,
  });
  return NextResponse.json({ id: msgId }, { status: 201 });
}
