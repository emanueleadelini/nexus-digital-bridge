import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { sectors } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { listSectors } from "@/server/data";
import { randomUUID } from "crypto";

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  return NextResponse.json(await listSectors());
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { name } = (await req.json()) as { name?: string };
  const clean = String(name || "").trim();
  if (!clean || clean.length > 80) {
    return NextResponse.json({ error: "Nome settore non valido" }, { status: 400 });
  }
  const id = randomUUID();
  try {
    await db.insert(sectors).values({ id, name: clean });
  } catch {
    return NextResponse.json({ error: "Settore gia' esistente" }, { status: 409 });
  }
  return NextResponse.json({ id }, { status: 201 });
}
