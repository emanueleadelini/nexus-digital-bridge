import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { user as userTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendApprovalEmail, sendRejectionEmail } from "@/server/mail";
import { notify } from "@/server/data";

// PATCH: { status } per approva/rifiuta (Admin+SuperAdmin) — oppure
// { role: "Admin" } per promuovere / { role: "revoke" } per revocare (solo SuperAdmin).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: me } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { id } = await params;

  const body = (await req.json()) as { status?: string; role?: string };
  const { status, role } = body;

  const [target] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

  // Il Super Admin non e' modificabile via API (si gestisce solo lato DB).
  if (target.role === "SuperAdmin") {
    return NextResponse.json({ error: "Il Super Admin non e' modificabile" }, { status: 403 });
  }

  // ---- Gestione ruolo: solo Super Admin decide quando serve un Admin ----
  if (role !== undefined) {
    if (me.role !== "SuperAdmin") {
      return NextResponse.json(
        { error: "Solo il Super Admin puo' gestire i ruoli Admin" },
        { status: 403 }
      );
    }
    if (id === me.id) {
      return NextResponse.json({ error: "Non puoi modificare il tuo ruolo" }, { status: 400 });
    }

    if (role === "Admin") {
      if (target.role !== "Company" && target.role !== "Institute") {
        return NextResponse.json({ error: "Ruolo non promuovibile" }, { status: 400 });
      }
      await db
        .update(userTable)
        .set({ role: "Admin", previousRole: target.role, updatedAt: new Date() })
        .where(eq(userTable.id, id));
      notify(target.id, "account", "Ruolo Admin assegnato", "Sei stato nominato Admin della piattaforma.", "/admin").catch(() => {});
      return NextResponse.json({ success: true, role: "Admin" });
    }

    if (role === "revoke") {
      if (target.role !== "Admin") {
        return NextResponse.json({ error: "L'utente non e' Admin" }, { status: 400 });
      }
      const restored = target.previousRole === "Company" || target.previousRole === "Institute"
        ? target.previousRole
        : "Pending";
      await db
        .update(userTable)
        .set({ role: restored, previousRole: null, updatedAt: new Date() })
        .where(eq(userTable.id, id));
      return NextResponse.json({ success: true, role: restored });
    }

    return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
  }

  // ---- Gestione stato ----
  if (status !== "Approved" && status !== "Rejected" && status !== "Pending") {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  }

  await db.update(userTable).set({ status, updatedAt: new Date() }).where(eq(userTable.id, id));

  if (status === "Approved") {
    sendApprovalEmail(target.email, target.name).catch(() => {});
    notify(target.id, "account", "Account approvato", "Il tuo account e' ora attivo.", "/dashboard").catch(() => {});
  } else if (status === "Rejected") {
    sendRejectionEmail(target.email, target.name).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
