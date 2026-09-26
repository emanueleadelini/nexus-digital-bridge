import { NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { companies, institutes, studentCvs, sectors, instituteTypes, user as userTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// POST: genera dati demo (10 aziende, 10 istituti, 100 CV)
export async function POST() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;

  const secs = await db.select().from(sectors);
  const typs = await db.select().from(instituteTypes);
  if (!secs.length || !typs.length) {
    return NextResponse.json(
      { error: "Inizializza prima Settori e Tipologie dal pulsante dedicato." },
      { status: 400 }
    );
  }

  const pick = <T,>(arr: T[], n: number) =>
    [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

  for (let i = 1; i <= 10; i++) {
    const companyId = `demo-company-${i}`;
    const randomSectors = pick(secs, 2).map(s => s.name);
    await db.insert(userTable).values({
      id: companyId, name: `Azienda Demo ${i}`, email: `demo-company-${i}@demo.local`,
      role: "Company", status: "Approved",
    }).onConflictDoNothing();
    await db.insert(companies).values({
      id: companyId, name: `Azienda Demo ${i} - ${randomSectors[0]}`,
      email: `demo-company-${i}@demo.local`,
      vatNumber: `IT1234567890${i}`, address: `Via delle Imprese ${i}, Milano`,
      website: `https://demo-azienda-${i}.it`, sectorIds: randomSectors, isDemo: true,
    }).onConflictDoNothing();
  }

  for (let i = 1; i <= 10; i++) {
    const instId = `demo-institute-${i}`;
    const instType = typs[Math.floor(Math.random() * typs.length)].name;
    await db.insert(userTable).values({
      id: instId, name: `Istituto Demo ${i}`, email: `demo-institute-${i}@demo.local`,
      role: "Institute", status: "Approved",
    }).onConflictDoNothing();
    await db.insert(institutes).values({
      id: instId, name: `Istituto Demo ${i} - ${instType}`,
      email: `demo-institute-${i}@demo.local`,
      address: `Piazza della Scuola ${i}, Roma`, types: [instType], isDemo: true,
    }).onConflictDoNothing();

    for (let j = 1; j <= 10; j++) {
      const cvSectors = pick(secs, 2).map(s => s.name);
      await db.insert(studentCvs).values({
        id: `demo-cv-${i}-${j}`,
        instituteId: instId,
        name: `Studente Demo ${i}${j}`,
        studentClass: "5A Informatica",
        cvInformation: `Profilo di prova per lo studente ${i}${j}. Eccellenti capacità in ${cvSectors.join(" e ")}.`,
        sectorIds: cvSectors,
        isDemo: true,
      }).onConflictDoNothing();
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE: rimuove tutti i dati demo
export async function DELETE() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;

  // I record demo hanno id "demo-*"; le FK cascade eliminano i profili collegati
  await db.delete(studentCvs).where(eq(studentCvs.isDemo, true));
  await db.delete(companies).where(eq(companies.isDemo, true));
  await db.delete(institutes).where(eq(institutes.isDemo, true));
  await db.execute(`DELETE FROM "user" WHERE id LIKE 'demo-%'`);

  return NextResponse.json({ success: true });
}
