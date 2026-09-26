import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { institutes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/guard";

// Azienda: lista istituti approvati (non-demo) con filtri
export async function GET(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const rows = await db
    .select()
    .from(institutes)
    .where(eq(institutes.isDemo, false));

  const q = (req.nextUrl.searchParams.get("q") || "").toLowerCase();
  const type = req.nextUrl.searchParams.get("type") || "all";

  const filtered = rows.filter((i) => {
    const okQ =
      !q ||
      i.name.toLowerCase().includes(q) ||
      (i.address || "").toLowerCase().includes(q);
    const okT = type === "all" || (i.types || []).includes(type);
    return okQ && okT;
  });
  return NextResponse.json(filtered);
}
