import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { studentCvs } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/guard";
import { readCvPdf } from "@/server/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const [cv] = await db.select().from(studentCvs).where(eq(studentCvs.id, id)).limit(1);
  if (!cv || !cv.pdfPath) {
    return NextResponse.json({ error: "PDF non disponibile" }, { status: 404 });
  }
  // Institute gestisce solo i propri; Company/Admin leggono per valutazione
  if (user.role === "Institute" && cv.instituteId !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const buf = await readCvPdf(cv.pdfPath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cv-${cv.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File non trovato" }, { status: 404 });
  }
}
