import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { instituteTypes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { listInstituteTypes } from "@/server/data";
import { randomUUID } from "crypto";

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  return NextResponse.json(await listInstituteTypes());
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { name } = (await req.json()) as { name?: string };
  const clean = String(name || "").trim();
  if (!clean || clean.length > 120) {
    return NextResponse.json({ error: "Nome tipologia non valido" }, { status: 400 });
  }
  const id = randomUUID();
  try {
    await db.insert(instituteTypes).values({ id, name: clean });
  } catch {
    return NextResponse.json({ error: "Tipologia gia' esistente" }, { status: 409 });
  }
  return NextResponse.json({ id }, { status: 201 });
}
