import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { companies, institutes, studentCvs, sectors } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

// Stats pubbliche per la landing page (nessun dato personale)
export async function GET() {
  try {
    const [[comp], [inst], [cvs], [sec]] = await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(companies).where(eq(companies.isDemo, false)),
      db.select({ n: sql<number>`count(*)` }).from(institutes).where(eq(institutes.isDemo, false)),
      db.select({ n: sql<number>`count(*)` }).from(studentCvs).where(eq(studentCvs.isDemo, false)),
      db.select({ n: sql<number>`count(*)` }).from(sectors),
    ]);
    return NextResponse.json({
      companies: Number(comp.n),
      institutes: Number(inst.n),
      students: Number(cvs.n),
      sectors: Number(sec.n),
    });
  } catch {
    return NextResponse.json({ companies: 0, institutes: 0, students: 0, sectors: 0 });
  }
}
