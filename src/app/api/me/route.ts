import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { companies, institutes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/guard";

export async function GET() {
  const { error, user } = await requireUser({ approved: false });
  if (error) return error;

  const profile =
    user.role === "Company"
      ? (await db.select().from(companies).where(eq(companies.id, user.id)).limit(1))[0] || null
      : user.role === "Institute"
        ? (await db.select().from(institutes).where(eq(institutes.id, user.id)).limit(1))[0] || null
        : null;

  return NextResponse.json({ user, profile });
}
