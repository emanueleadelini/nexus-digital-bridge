/**
 * Algoritmo di matching deterministico Nexus (spiegabile, auditabile).
 * Score = copertura settori (max 90) + bonus keyword nel sommario (max +10).
 */
export interface ScorableCV {
  sectorIds: string[];
  cvInformation?: string | null;
  skills?: string[] | null;
}

export function calculateMatchScore(
  student: ScorableCV,
  companySectors: string[]
): { score: number; common: string[] } {
  const studentSectors = student.sectorIds || [];
  if (!studentSectors.length || !companySectors.length)
    return { score: 0, common: [] };

  const common = companySectors.filter((s) => studentSectors.includes(s));
  const sectorCoverage =
    common.length / Math.max(companySectors.length, studentSectors.length);
  let score = sectorCoverage * 90;

  const haystack =
    `${student.cvInformation || ""} ${(student.skills || []).join(" ")}`.toLowerCase();
  let bonus = 0;
  companySectors
    .filter((s) => !studentSectors.includes(s))
    .forEach((s) => {
      if (haystack.includes(s.toLowerCase())) bonus += 5;
    });
  (student.skills || []).forEach((skill) => {
    if (haystack.length && companySectors.length === 0) return;
  });

  return { score: Math.min(Math.round(score + bonus), 100), common };
}
