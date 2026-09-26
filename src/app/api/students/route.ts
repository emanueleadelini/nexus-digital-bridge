import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { studentCvs } from "@/server/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { requireUser } from "@/server/guard";
import { saveCvPdf } from "@/server/uploads";
import { extractPdfText, parseCVText } from "@/server/ai";
import { notifyNewCvMatches } from "@/server/data";
import { randomUUID } from "crypto";

const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim();

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() || "";
  const instituteId = req.nextUrl.searchParams.get("instituteId");

  // Istituto: solo i propri. Azienda: puo' leggere i CV di un istituto (via search)
  // o l'intero bacino (via matches). Admin: tutto.
  let rows;
  if (user.role === "Institute") {
    rows = await db.select().from(studentCvs).where(eq(studentCvs.instituteId, user.id));
  } else if (instituteId) {
    rows = await db
      .select()
      .from(studentCvs)
      .where(and(eq(studentCvs.instituteId, instituteId), eq(studentCvs.isDemo, false)));
  } else {
    rows = await db.select().from(studentCvs).where(eq(studentCvs.isDemo, false));
  }

  const filtered = q
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.studentClass.toLowerCase().includes(q)
      )
    : rows;
  return NextResponse.json(filtered);
}

// POST multipart: pdf (file) — crea CV. Campi opzionali: se presente il PDF
// viene salvato e l'AI estrae/suggerisce (con override dai campi manuali).
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser({ role: "Institute" });
  if (error) return error;

  const form = await req.formData();
  const file = form.get("pdf") as File | null;

  let name = sanitize(String(form.get("name") || ""));
  let studentClass = sanitize(String(form.get("class") || ""));
  let cvInformation = String(form.get("cvInformation") || "");
  let sectorIds: string[] = [];
  let skills: string[] = [];
  try {
    sectorIds = JSON.parse(String(form.get("sectorIds") || "[]"));
    skills = JSON.parse(String(form.get("skills") || "[]"));
  } catch {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  let pdfPath: string | null = null;
  if (file && file.size > 0) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Solo file PDF" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF oltre 10MB" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const cvId = randomUUID();
    pdfPath = await saveCvPdf(cvId, buffer);

    // Se i campi non sono stati compilati a mano, l'AI li estrae ora
    if (!name || !cvInformation || !sectorIds.length) {
      try {
        const text = await extractPdfText(buffer);
        const parsed = await parseCVText(text);
        name = name || parsed.name;
        studentClass = studentClass || parsed.studentClass;
        cvInformation = cvInformation || parsed.summary;
        sectorIds = sectorIds.length ? sectorIds : parsed.suggestedSectorIds;
        skills = skills.length ? skills : parsed.skills;
      } catch (e) {
        console.error("[students] AI parse failed:", (e as Error).message);
      }
    }

    await db.insert(studentCvs).values({
      id: cvId,
      instituteId: user.id,
      name: name || "Studente",
      studentClass,
      cvInformation,
      sectorIds: sectorIds.map(sanitize).filter(Boolean),
      skills: skills.map(sanitize).filter(Boolean),
      pdfPath,
      isDemo: false,
    });
    notifyNewCvMatches(cvId).catch(() => {});
    return NextResponse.json({ id: cvId }, { status: 201 });
  }

  if (!sectorIds.length) {
    return NextResponse.json(
      { error: "Seleziona almeno un settore per il matching" },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
  }

  const cvId = randomUUID();
  await db.insert(studentCvs).values({
    id: cvId,
    instituteId: user.id,
    name,
    studentClass,
    cvInformation,
    sectorIds: sectorIds.map(sanitize).filter(Boolean),
    skills: skills.map(sanitize).filter(Boolean),
    isDemo: false,
  });
  notifyNewCvMatches(cvId).catch(() => {});
  return NextResponse.json({ id: cvId }, { status: 201 });
}
