"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

/**
 * Guardia area admin: solo Admin approvato con email verificata.
 * Fail-closed: profilo mancante/illeggibile = uscita, mai spinner infinito.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [loadFailed, setLoadFailed] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user || !user.emailVerified) {
      router.replace("/login");
      return;
    }

    if (!userProfile) {
      setLoadFailed(true);
      return;
    }

    if (userProfile.role !== "Admin" || userProfile.status !== "Approved") {
      router.replace("/dashboard");
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  if (loadFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="text-center space-y-4">
          <p className="text-slate-600 font-medium">Impossibile caricare il profilo amministratore.</p>
          <button
            onClick={() => router.replace("/login")}
            className="text-primary font-bold hover:underline"
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  if (isUserLoading || isProfileLoading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (userProfile.role !== "Admin" || userProfile.status !== "Approved") {
    return null;
  }

  return <>{children}</>;
}
