"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAdminRole } from "@/types";

export interface MeUser {
  id: string;
  email: string;
  name: string;
  role: "Company" | "Institute" | "Admin" | "SuperAdmin";
  status: "Pending" | "Approved" | "Rejected";
  firstName?: string | null;
  lastName?: string | null;
}

export interface Me {
  user: MeUser;
  profile: Record<string, unknown> | null;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        setMe(null);
      } else {
        setMe(await res.json());
      }
    } catch {
      setMe(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { me, user: me?.user ?? null, profile: me?.profile ?? null, isLoading, refetch };
}

/**
 * Guard route dashboard: redirect login/pending/rejected come da status.
 * Sostituisce il vecchio useAuthGuard basato su Firebase.
 */
export function useAuthGuard(requiredRole?: MeUser["role"]) {
  const { me, user, profile, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.status === "Pending" && !window.location.pathname.includes("pending-approval")) {
      router.replace("/pending-approval");
      return;
    }
    if (user.status === "Rejected") {
      router.replace("/rejected");
      return;
    }
    if (requiredRole && user.role !== requiredRole && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router, requiredRole]);

  return { user, userProfile: user, profile, isLoading };
}

/** Fetch JSON con polling opzionale (per chat e notifiche). */
export function useApiData<T>(url: string | null, pollMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!url) {
      setData(null);
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
    if (pollMs > 0 && url) {
      timer.current = setInterval(() => load(true), pollMs);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }
  }, [load, pollMs, url]);

  return { data, isLoading, error, refetch: load };
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit & { json?: unknown }
): Promise<{ ok: boolean; status: number; data: T | { error?: string } }> {
  const { json, ...init } = options || {};
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    ...(json !== undefined
      ? { method: init.method || "POST", headers: { "Content-Type": "application/json", ...(init.headers || {}) }, body: JSON.stringify(json) }
      : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
