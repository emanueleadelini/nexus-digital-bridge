import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { getMatchesForCompany, getMatchesForInstitute } from "@/server/data";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.role === "Company") {
    const matches = await getMatchesForCompany(user.id);
    if (!Array.isArray(matches)) {
      return NextResponse.json({ error: matches.error }, { status: matches.status });
    }
    return NextResponse.json({ role: "Company", matches });
  }
  if (user.role === "Institute") {
    const perCv = await getMatchesForInstitute(user.id);
    return NextResponse.json({ role: "Institute", students: perCv });
  }
  return NextResponse.json({ error: "Ruolo non supportato" }, { status: 400 });
}
