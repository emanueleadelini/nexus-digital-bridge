import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { getChatsForUser, nameMaps, getMessages } from "@/server/data";

// Admin: lista completa chat (audit read-only)
export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const list = await getChatsForUser("", "Admin");
  const names = await nameMaps();
  const enriched = await Promise.all(
    list.map(async (c) => ({
      ...c,
      companyName: names.companies[c.companyId] || "Azienda",
      instituteName: names.institutes[c.instituteId] || "Istituto",
      messageCount: (await getMessages(c.id)).length,
    }))
  );
  return NextResponse.json(enriched);
}
