import { NextResponse } from "next/server";
import { listInstituteTypes } from "@/server/data";

export async function GET() {
  return NextResponse.json(await listInstituteTypes());
}
