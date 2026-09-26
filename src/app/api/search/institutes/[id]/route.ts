import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { institutes, studentCvs, companies } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/server/guard";
import { calculateMatchScore } from "@/server/matching";

// Dettaglio istituto + i suoi CV con % di match vs l'azienda chiamante
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const [institute] = await db
    .select()
    .from(institutes)
    .where(eq(institutes.id, id))
    .limit(1);
  if (!institute || institute.isDemo) {
    return NextResponse.json({ error: "Istituto non trovato" }, { status: 404 });
  }

  const cvs = await db
    .select()
    .from(studentCvs)
    .where(and(eq(studentCvs.instituteId, id), eq(studentCvs.isDemo, false)));

  // score vs settori dell'azienda chiamante (0 se non e' azienda)
  let companySectors: string[] = [];
  if (user.role === "Company") {
    const [c] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.id))
      .limit(1);
    companySectors = c?.sectorIds || [];
  }

  const students = cvs.map((cv) => {
    const { score, common } = calculateMatchScore(cv, companySectors);
    return { ...cv, matchScore: score, commonSectors: common };
  });

  return NextResponse.json({ institute, students });
}
