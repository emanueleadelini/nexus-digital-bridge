import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { studentCvs } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, isAdminRole } from "@/server/guard";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const [cv] = await db.select().from(studentCvs).where(eq(studentCvs.id, id)).limit(1);
  if (!cv) return NextResponse.json({ error: "CV non trovato" }, { status: 404 });
  if (!isAdminRole(user.role) && cv.instituteId !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await db.delete(studentCvs).where(eq(studentCvs.id, id));
  if (cv.pdfPath) {
    const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    await unlink(path.join(dir, cv.pdfPath)).catch(() => {});
  }
  return NextResponse.json({ success: true });
}
