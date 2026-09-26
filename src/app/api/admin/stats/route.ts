import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { getStats } from "@/server/data";

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  return NextResponse.json(await getStats());
}
