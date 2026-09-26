import { db } from "./db/client";
import {
  user,
  companies,
  institutes,
  studentCvs,
  sectors,
  instituteTypes,
  chats,
  messages,
  blogPosts,
  notifications,
} from "./db/schema";
import { eq, and, or, desc, asc, isNull, sql, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { calculateMatchScore } from "./matching";
import { isAdminRole } from "@/types";

// ---------- lookup maps ----------

export async function nameMaps() {
  const [cs, is] = await Promise.all([
    db.select({ id: companies.id, name: companies.name }).from(companies),
    db.select({ id: institutes.id, name: institutes.name }).from(institutes),
  ]);
  return {
    companies: Object.fromEntries(cs.map((c) => [c.id, c.name])),
    institutes: Object.fromEntries(is.map((i) => [i.id, i.name])),
  };
}

// ---------- matches ----------

export async function getMatchesForCompany(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return { error: "Profilo azienda non trovato", status: 404 };

  const cvs = await db
    .select()
    .from(studentCvs)
    .where(eq(studentCvs.isDemo, false));
  const instNames = (await nameMaps()).institutes;

  return cvs
    .map((cv) => {
      const { score, common } = calculateMatchScore(cv, company.sectorIds);
      return {
        student: { ...cv, instituteName: instNames[cv.instituteId] || "Istituto" },
        matchScore: score,
        commonSectors: common,
      };
    })
    .filter((m) => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getMatchesForInstitute(instituteId: string) {
  const myCvs = await db
    .select()
    .from(studentCvs)
    .where(and(eq(studentCvs.instituteId, instituteId), eq(studentCvs.isDemo, false)));

  const allCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.isDemo, false));

  // aziende approvate = solo quelle con utente approved
  const approvedCompanies = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "Company"), eq(user.status, "Approved")));
  const approvedIds = new Set(approvedCompanies.map((c) => c.id));

  const myChats = await db
    .select()
    .from(chats)
    .where(eq(chats.instituteId, instituteId));
  const chatByCompanyCv = new Set(
    myChats.map((c) => `${c.companyId}:${c.studentCvId || ""}`)
  );

  return myCvs.map((cv) => ({
    student: cv,
    interestedCompanies: allCompanies
      .filter((c) => approvedIds.has(c.id))
      .map((c) => {
        const { score, common } = calculateMatchScore(cv, c.sectorIds);
        return {
          companyId: c.id,
          companyName: c.name,
          matchScore: score,
          commonSectors: common,
          chatStarted: chatByCompanyCv.has(`${c.id}:${cv.id}`) || chatByCompanyCv.has(`${c.id}:`),
        };
      })
      .filter((x) => x.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore),
  }));
}

export async function instituteHasMatchWith(
  instituteId: string,
  companyId: string
): Promise<boolean> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return false;
  const myCvs = await db
    .select()
    .from(studentCvs)
    .where(eq(studentCvs.instituteId, instituteId));
  return myCvs.some((cv) => calculateMatchScore(cv, company.sectorIds).score > 0);
}

// ---------- chats ----------

export async function getChatsForUser(userId: string, role: string) {
  const where =
    isAdminRole(role)
      ? undefined
      : role === "Company"
        ? eq(chats.companyId, userId)
        : eq(chats.instituteId, userId);
  return db
    .select()
    .from(chats)
    .where(where)
    .orderBy(desc(chats.lastMessageAt));
}

export async function getChatById(id: string) {
  const [c] = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
  return c || null;
}

export function canAccessChat(chat: { companyId: string; instituteId: string }, userId: string, role: string) {
  return isAdminRole(role) || chat.companyId === userId || chat.instituteId === userId;
}

export async function createChat(params: {
  companyId: string;
  instituteId: string;
  studentCvId?: string | null;
  creatorId: string;
}) {
  // dedup: una chat per coppia (company, institute, studentCv)
  const existing = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.companyId, params.companyId),
        eq(chats.instituteId, params.instituteId),
        params.studentCvId
          ? eq(chats.studentCvId, params.studentCvId)
          : isNull(chats.studentCvId)
      )
    )
    .limit(1);
  if (existing.length) return existing[0];

  const id = randomUUID();
  await db.insert(chats).values({
    id,
    companyId: params.companyId,
    instituteId: params.instituteId,
    studentCvId: params.studentCvId || null,
    creatorId: params.creatorId,
    lastMessage: "Conversazione avviata.",
    lastMessageAt: new Date(),
    lastSenderId: params.creatorId,
  });
  const [created] = await db.select().from(chats).where(eq(chats.id, id));
  return created;
}

export async function getMessages(chatId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));
}

export async function addMessage(params: {
  chatId: string;
  senderId: string;
  senderEmail: string;
  senderRole: string;
  text: string;
}) {
  const id = randomUUID();
  await db.insert(messages).values({ id, ...params });
  await db
    .update(chats)
    .set({ lastMessage: params.text, lastMessageAt: new Date(), lastSenderId: params.senderId })
    .where(eq(chats.id, params.chatId));
  return id;
}

// ---------- notifications ----------

export async function getUnreadNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function notify(userId: string, type: string, title: string, body: string, link?: string) {
  await db.insert(notifications).values({ id: randomUUID(), userId, type, title, body, link });
}

/** Quando entra un nuovo CV, notifica le aziende approvate con match >= soglia. */
export async function notifyNewCvMatches(cvId: string) {
  const [cv] = await db.select().from(studentCvs).where(eq(studentCvs.id, cvId)).limit(1);
  if (!cv) return;
  const [institute] = await db.select().from(institutes).where(eq(institutes.id, cv.instituteId)).limit(1);
  const approved = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "Company"), eq(user.status, "Approved")));
  if (!approved.length) return;
  const allCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.isDemo, false));
  const approvedIds = new Set(approved.map((a) => a.id));

  for (const c of allCompanies) {
    if (!approvedIds.has(c.id)) continue;
    const { score } = calculateMatchScore(cv, c.sectorIds);
    if (score >= 50) {
      await notify(
        c.id,
        "new_match",
        `Nuovo match ${score}%`,
        `${cv.name} (${institute?.name || "istituto"}) e' compatibile con i tuoi settori.`,
        "/dashboard/matches"
      );
    }
  }
}

// ---------- admin ----------

export async function listUsers() {
  return db.select().from(user).orderBy(desc(user.createdAt));
}

export async function setUserStatus(userId: string, status: UserStatusValue) {
  await db.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, userId));
}
type UserStatusValue = "Pending" | "Approved" | "Rejected";

export async function getStats() {
  const [[comp], [inst], [cvs], [chatCount], [msgCount]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(companies).where(eq(companies.isDemo, false)),
    db.select({ n: sql<number>`count(*)` }).from(institutes).where(eq(institutes.isDemo, false)),
    db.select({ n: sql<number>`count(*)` }).from(studentCvs).where(eq(studentCvs.isDemo, false)),
    db.select({ n: sql<number>`count(*)` }).from(chats),
    db.select({ n: sql<number>`count(*)` }).from(messages),
  ]);
  const [{ n: pending }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.status, "Pending"));
  return {
    companies: Number(comp.n),
    institutes: Number(inst.n),
    students: Number(cvs.n),
    chats: Number(chatCount.n),
    messages: Number(msgCount.n),
    pendingUsers: Number(pending),
  };
}

// ---------- misc reads ----------

export async function listSectors() {
  return db.select().from(sectors).orderBy(asc(sectors.name));
}
export async function listInstituteTypes() {
  return db.select().from(instituteTypes).orderBy(asc(instituteTypes.name));
}
export async function listBlogPosts(includeDemo = false) {
  const q = db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  return includeDemo ? q : q.where(eq(blogPosts.isDemo, false));
}
