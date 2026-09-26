"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/api";
import { isAdminRole } from "@/types";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdminRole(user.role)) return null;

  return <>{children}</>;
}
