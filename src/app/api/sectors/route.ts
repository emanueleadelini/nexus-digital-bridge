import { NextResponse } from "next/server";
import { listSectors, listInstituteTypes } from "@/server/data";

// Liste pubbliche: servono gia' in fase di registrazione
export async function GET() {
  return NextResponse.json(await listSectors());
}
