import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { extractPdfText, parseCVText } from "@/server/ai";

// POST multipart: pdf — restituisce l'anteprima AI senza salvare nulla.
export async function POST(req: NextRequest) {
  const { error } = await requireUser({ role: "Institute" });
  if (error) return error;

  const form = await req.formData();
  const file = form.get("pdf") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "PDF mancante" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF oltre 10MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);
    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "PDF senza testo estraibile (scansione?)" },
        { status: 422 }
      );
    }
    const parsed = await parseCVText(text);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[students/parse]", e);
    return NextResponse.json(
      { error: "Analisi AI fallita. Compila i campi manualmente." },
      { status: 502 }
    );
  }
}
