import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { listUsers } from "@/server/data";
import { db } from "@/server/db/client";
import { companies, institutes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;

  const users = await listUsers();
  const [cs, is] = await Promise.all([
    db.select().from(companies),
    db.select().from(institutes),
  ]);
  const profileById = new Map([...cs, ...is].map((p) => [p.id, p]));

  return NextResponse.json(
    users.map((u) => ({ ...u, profile: profileById.get(u.id) || null }))
  );
}
