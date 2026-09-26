import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { instituteTypes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { id } = await params;
  await db.delete(instituteTypes).where(eq(instituteTypes.id, id));
  return NextResponse.json({ success: true });
}
