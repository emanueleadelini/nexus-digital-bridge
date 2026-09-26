import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { user as userTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendApprovalEmail, sendRejectionEmail } from "@/server/mail";
import { notify } from "@/server/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { id } = await params;

  const { status } = (await req.json()) as { status?: string };
  if (status !== "Approved" && status !== "Rejected" && status !== "Pending") {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  }

  const [target] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

  await db.update(userTable).set({ status, updatedAt: new Date() }).where(eq(userTable.id, id));

  if (status === "Approved") {
    sendApprovalEmail(target.email, target.name).catch(() => {});
    notify(target.id, "account", "Account approvato", "Il tuo account e' ora attivo.", "/dashboard").catch(() => {});
  } else if (status === "Rejected") {
    sendRejectionEmail(target.email, target.name).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
