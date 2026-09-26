/**
 * Parsing CV via LLM self-hosted su OVH (llama-swap, OpenAI-compatible).
 * Estrazione testo dal PDF lato server, poi prompt strutturato -> JSON.
 * Config in env: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
 * (sul server valorizzate da /root/shared/chatmate.env).
 */
import { INDUSTRY_SECTORS } from "@/lib/constants";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const execFileP = promisify(execFile);

export interface ParsedCV {
  name: string;
  studentClass: string;
  summary: string;
  suggestedSectorIds: string[];
  skills: string[];
}

const LLM_BASE_URL =
  process.env.LLM_BASE_URL ||
  process.env.CHATMATE_URL ||
  "http://host.docker.internal:11600/v1";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.CHATMATE_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || process.env.CHATMATE_MODEL || "gpt-oss-120b";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdftotext (poppler): parser PDF di riferimento, gestisce qualunque variante.
  // Installato nel Dockerfile via `apk add poppler-utils`.
  const tmp = join(tmpdir(), `cv-${randomUUID()}.pdf`);
  try {
    await writeFile(tmp, buffer);
    const { stdout } = await execFileP("pdftotext", ["-layout", tmp, "-"], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout.trim();
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

export async function parseCVText(pdfText: string): Promise<ParsedCV> {
  const trimmed = pdfText.slice(0, 12000);
  const prompt = `Sei un esperto di selezione del personale e orientamento scolastico per la piattaforma "Nexus Digital Bridge".
Analizza questo testo estratto da un CV Europass di uno studente e rispondi SOLO con un oggetto JSON valido, senza testo extra, senza markdown.

REGOLE:
1. "name": solo nome e cognome.
2. "studentClass": ultimo anno di corso o indirizzo di studi (es. "5A Informatica"). Se non trovato, stringa vuota.
3. "summary": 3-4 righe professionali che valorizzano il talento dello studente per un'azienda, evidenziando le hard skills.
4. "suggestedSectorIds": scegli ESCLUSIVAMENTE da questa lista ufficiale di settori Confindustria: ${INDUSTRY_SECTORS.join(", ")}
5. "skills": lista di 3-8 hard skill estratte (es. "Python", "CAD", "Contabilita'").

Formato risposta: {"name":"...","studentClass":"...","summary":"...","suggestedSectorIds":["..."],"skills":["..."]}

TESTO CV:
${trimmed}`;

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(LLM_API_KEY ? { Authorization: `Bearer ${LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM parse failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content || "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<ParsedCV>;

  const validSectors = new Set(INDUSTRY_SECTORS as readonly string[]);
  return {
    name: String(parsed.name || "").trim(),
    studentClass: String(parsed.studentClass || parsed.studentClass || "").trim(),
    summary: String(parsed.summary || "").trim(),
    suggestedSectorIds: (parsed.suggestedSectorIds || []).filter((s) =>
      validSectors.has(String(s))
    ),
    skills: (parsed.skills || []).map((s) => String(s)).slice(0, 10),
  };
}
