import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { companies, institutes } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/guard";

const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim();

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = (await req.json()) as Record<string, unknown>;
  const sectors = Array.isArray(body.sectorIds)
    ? body.sectorIds.map(String).map(sanitize).filter(Boolean)
    : undefined;

  if (user.role === "Company") {
    await db
      .update(companies)
      .set({
        ...(body.name ? { name: sanitize(String(body.name)) } : {}),
        ...(body.vatNumber !== undefined ? { vatNumber: sanitize(String(body.vatNumber)) } : {}),
        ...(body.address !== undefined ? { address: sanitize(String(body.address)) } : {}),
        ...(body.website !== undefined ? { website: sanitize(String(body.website)) } : {}),
        ...(body.description !== undefined ? { description: sanitize(String(body.description)) } : {}),
        ...(sectors ? { sectorIds: sectors } : {}),
      })
      .where(eq(companies.id, user.id));
  } else if (user.role === "Institute") {
    const types = Array.isArray(body.types)
      ? body.types.map(String).map(sanitize).filter(Boolean)
      : undefined;
    await db
      .update(institutes)
      .set({
        ...(body.name ? { name: sanitize(String(body.name)) } : {}),
        ...(body.address !== undefined ? { address: sanitize(String(body.address)) } : {}),
        ...(sectors ? { sectorIds: sectors } : {}),
        ...(types ? { types } : {}),
      })
      .where(eq(institutes.id, user.id));
  }
  return NextResponse.json({ success: true });
}
