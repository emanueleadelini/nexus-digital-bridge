import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { config } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const CONFIG_ID = "landingPage";

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const [row] = await db.select().from(config).where(eq(config.id, CONFIG_ID)).limit(1);
  return NextResponse.json(row ? JSON.parse(row.value) : {});
}

export async function PUT(req: NextRequest) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const body = await req.json();
  const value = JSON.stringify(body);
  const [existing] = await db.select().from(config).where(eq(config.id, CONFIG_ID)).limit(1);
  if (existing) {
    await db.update(config).set({ value }).where(eq(config.id, CONFIG_ID));
  } else {
    await db.insert(config).values({ id: CONFIG_ID, value });
  }
  return NextResponse.json({ success: true });
}
