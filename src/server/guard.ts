import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db/client";
import { user as userTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { isAdminRole } from "@/types";

export type UserRole = "Company" | "Institute" | "Admin" | "SuperAdmin";
export type UserStatus = "Pending" | "Approved" | "Rejected";

export { isAdminRole };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string | null;
  lastName?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const hdrs = await headers();
  const sess = await auth.api.getSession({ headers: hdrs });
  if (!sess?.user) return null;
  const [row] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sess.user.id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: (row.role as UserRole) || "Pending",
    status: (row.status as UserStatus) || "Pending",
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

type GuardFail = { error: NextResponse; user: null };
type GuardOk = { error: null; user: SessionUser };

export async function requireUser(opts?: {
  role?: UserRole;
  approved?: boolean;
}): Promise<GuardFail | GuardOk> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }), user: null };
  }
  if (opts?.approved !== false && user.status !== "Approved" && !isAdminRole(user.role)) {
    return { error: NextResponse.json({ error: "Account non approvato" }, { status: 403 }), user: null };
  }
  if (opts?.role === "SuperAdmin") {
    if (user.role !== "SuperAdmin") {
      return { error: NextResponse.json({ error: "Solo il Super Admin" }, { status: 403 }), user: null };
    }
  } else if (opts?.role && user.role !== opts.role && !isAdminRole(user.role)) {
    return { error: NextResponse.json({ error: "Ruolo non autorizzato" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

/** Solo il Super Admin (es. gestione ruoli Admin). */
export function requireSuperAdmin() {
  return requireUser({ role: "SuperAdmin" });
}
