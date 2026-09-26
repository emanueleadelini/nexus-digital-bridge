import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { user, companies, institutes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notifyAdminOfNewUser, sendWelcomePendingEmail } from "@/server/mail";

const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      role,
      entityName,
      firstName,
      lastName,
      sectorIds,
      types,
      vatNumber,
      address,
      website,
    } = body as Record<string, unknown>;

    if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Email o password non validi" }, { status: 400 });
    }
    if (role !== "company" && role !== "institute") {
      return NextResponse.json({ error: "Tipo di account non valido" }, { status: 400 });
    }
    const cleanName = sanitize(String(entityName || ""));
    if (!cleanName) {
      return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
    }

    const emailLc = email.trim().toLowerCase();
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, emailLc)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Email gia' registrata" }, { status: 409 });
    }

    const signUp = await auth.api.signUpEmail({
      body: {
        email: emailLc,
        password,
        name: cleanName,
        firstName: sanitize(String(firstName || "")),
        lastName: sanitize(String(lastName || "")),
      },
    });
    if (!signUp?.user) {
      return NextResponse.json({ error: "Registrazione fallita" }, { status: 500 });
    }

    const userRole = role === "company" ? "Company" : "Institute";
    await db
      .update(user)
      .set({ role: userRole, status: "Pending" })
      .where(eq(user.id, signUp.user.id));

    const sectors = Array.isArray(sectorIds) ? sectorIds.map(String).map(sanitize).filter(Boolean) : [];
    if (role === "company") {
      await db.insert(companies).values({
        id: signUp.user.id,
        name: cleanName,
        email: emailLc,
        vatNumber: sanitize(String(vatNumber || "")),
        address: sanitize(String(address || "")),
        website: sanitize(String(website || "")),
        sectorIds: sectors,
        isDemo: false,
      });
    } else {
      const instTypes = Array.isArray(types) ? types.map(String).map(sanitize).filter(Boolean) : [];
      await db.insert(institutes).values({
        id: signUp.user.id,
        name: cleanName,
        email: emailLc,
        address: sanitize(String(address || "")),
        types: instTypes,
        sectorIds: sectors,
        isDemo: false,
      });
    }

    notifyAdminOfNewUser({ email: emailLc, role: userRole, name: cleanName }).catch(() => {});
    sendWelcomePendingEmail(emailLc, cleanName).catch(() => {});

    return NextResponse.json({ success: true, status: "Pending" });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Errore durante la registrazione" }, { status: 500 });
  }
}
