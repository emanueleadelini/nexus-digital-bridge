import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { config } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// GET pubblico: contenuti CMS della landing page
export async function GET() {
  try {
    const [row] = await db.select().from(config).where(eq(config.id, "landingPage")).limit(1);
    return NextResponse.json(row ? JSON.parse(row.value) : {});
  } catch {
    return NextResponse.json({});
  }
}
