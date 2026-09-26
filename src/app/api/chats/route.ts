import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import {
  getChatsForUser,
  createChat,
  instituteHasMatchWith,
  nameMaps,
} from "@/server/data";
import { db } from "@/server/db/client";
import { companies, institutes, user as userTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendNewChatEmail } from "@/server/mail";
import { notify } from "@/server/data";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;
  const list = await getChatsForUser(user.id, user.role);
  const names = await nameMaps();
  return NextResponse.json(
    list.map((c) => ({
      ...c,
      companyName: names.companies[c.companyId] || "Azienda",
      instituteName: names.institutes[c.instituteId] || "Istituto",
    }))
  );
}

// Regola: azienda -> istituto sempre; istituto -> azienda solo se match>0.
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = (await req.json()) as {
    instituteId?: string;
    companyId?: string;
    studentCvId?: string;
  };

  let companyId: string;
  let instituteId: string;
  let notifyUserId: string;
  let fromName: string;

  if (user.role === "Company") {
    companyId = user.id;
    instituteId = String(body.instituteId || "");
    if (!instituteId) return NextResponse.json({ error: "instituteId mancante" }, { status: 400 });
    const [target] = await db.select().from(institutes).where(eq(institutes.id, instituteId)).limit(1);
    if (!target) return NextResponse.json({ error: "Istituto non trovato" }, { status: 404 });
    const [me] = await db.select().from(companies).where(eq(companies.id, user.id)).limit(1);
    fromName = me?.name || user.name;
    notifyUserId = instituteId;
  } else if (user.role === "Institute") {
    instituteId = user.id;
    companyId = String(body.companyId || "");
    if (!companyId) return NextResponse.json({ error: "companyId mancante" }, { status: 400 });
    const [target] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!target) return NextResponse.json({ error: "Azienda non trovata" }, { status: 404 });
    const hasMatch = await instituteHasMatchWith(instituteId, companyId);
    if (!hasMatch) {
      return NextResponse.json(
        { error: "Puoi contattare un'azienda solo se esiste un match con un tuo studente" },
        { status: 403 }
      );
    }
    const [me] = await db.select().from(institutes).where(eq(institutes.id, user.id)).limit(1);
    fromName = me?.name || user.name;
    notifyUserId = companyId;
  } else {
    return NextResponse.json({ error: "Ruolo non autorizzato" }, { status: 403 });
  }

  const chat = await createChat({
    companyId,
    instituteId,
    studentCvId: body.studentCvId || null,
    creatorId: user.id,
  });

  // notifica in-app + email al destinatario (fire-and-forget)
  notify(
    notifyUserId,
    "new_chat",
    "Nuova conversazione",
    `${fromName} ha avviato una conversazione con te.`,
    "/dashboard/chat"
  ).catch(() => {});
  db.select()
    .from(userTable)
    .where(eq(userTable.id, notifyUserId))
    .limit(1)
    .then(([dest]) => {
      if (dest?.email) sendNewChatEmail(dest.email, dest.name, fromName).catch(() => {});
    })
    .catch(() => {});

  return NextResponse.json(chat, { status: 201 });
}
