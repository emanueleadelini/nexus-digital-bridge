import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { sectors, instituteTypes } from "@/server/db/schema";
import { INDUSTRY_SECTORS, INSTITUTE_TYPES } from "@/lib/constants";
import { randomUUID } from "crypto";

// POST: popola settori Confindustria e tipologie istituto (idempotente)
export async function POST() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;

  const existingSectors = new Set((await db.select().from(sectors)).map(s => s.name.toLowerCase()));
  const existingTypes = new Set((await db.select().from(instituteTypes)).map(t => t.name.toLowerCase()));

  let addedSectors = 0;
  let addedTypes = 0;

  for (const s of INDUSTRY_SECTORS) {
    if (!existingSectors.has(s.toLowerCase())) {
      await db.insert(sectors).values({ id: randomUUID(), name: s });
      addedSectors++;
    }
  }
  for (const t of INSTITUTE_TYPES) {
    if (!existingTypes.has(t.toLowerCase())) {
      await db.insert(instituteTypes).values({ id: randomUUID(), name: t });
      addedTypes++;
    }
  }

  return NextResponse.json({ addedSectors, addedTypes });
}
