/**
 * Storage PDF CV su filesystem (volume Docker /data).
 * Env: UPLOAD_DIR (default ./uploads, in container /app/uploads).
 */
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function saveCvPdf(cvId: string, buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_PDF_BYTES) throw new Error("PDF oltre 10MB");
  const dir = path.join(UPLOAD_DIR, "cv");
  await mkdir(dir, { recursive: true });
  const safeId = cvId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = path.join(dir, `${safeId}.pdf`);
  await writeFile(filePath, buffer);
  return path.join("cv", `${safeId}.pdf`);
}

export async function readCvPdf(relPath: string): Promise<Buffer> {
  const safe = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(UPLOAD_DIR, safe);
  if (!full.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error("path non valido");
  }
  return readFile(full);
}
