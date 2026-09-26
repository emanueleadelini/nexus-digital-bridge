/**
 * Parsing CV via LLM — primario Regolo AI (Italia, OpenAI-compatible),
 * fallback OVH Kepler (rotte autorizzate da /root/shared/* env).
 * Estrazione testo PDF lato server con pdftotext (poppler), poi JSON strutturato.
 * Env: LLM_BASE_URL/LLM_API_KEY/LLM_MODEL (primario),
 *      LLM_FALLBACK_BASE_URL/LLM_FALLBACK_API_KEY/LLM_FALLBACK_MODEL (fallback).
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
  process.env.LLM_BASE_URL || "https://api.regolo.ai/v1";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "glm5.2";
// Fallback autorizzato: OVH Kepler (CHATMATE_* da /root/shared/chatmate.env)
const LLM_FB_BASE_URL =
  process.env.LLM_FALLBACK_BASE_URL || process.env.CHATMATE_URL || "";
const LLM_FB_API_KEY = process.env.LLM_FALLBACK_API_KEY || process.env.CHATMATE_KEY || "";
const LLM_FB_MODEL =
  process.env.LLM_FALLBACK_MODEL || process.env.CHATMATE_MODEL || "gpt-oss-120b";

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

async function callLLM(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content || "";
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

  let raw: string;
  try {
    raw = await callLLM(LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, prompt);
  } catch (primaryErr) {
    if (!LLM_FB_BASE_URL) throw primaryErr;
    console.warn(
      `[ai] LLM primario fallito (${(primaryErr as Error).message.slice(0, 80)}) — fallback`
    );
    raw = await callLLM(LLM_FB_BASE_URL, LLM_FB_API_KEY, LLM_FB_MODEL, prompt);
  }

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
