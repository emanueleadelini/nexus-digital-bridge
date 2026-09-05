'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';
import { setSessionCookie, clearSessionCookie } from '@/lib/session-cookie';

/** Rinnova il cookie di sessione se il token scade tra meno di 10 minuti. */
async function refreshSessionCookieIfNeeded(user: { getIdToken: (force?: boolean) => Promise<string> }) {
  try {
    const token = await user.getIdToken();
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (typeof payload.exp !== 'number' || payload.exp * 1000 - Date.now() < 10 * 60 * 1000) {
      setSessionCookie(await user.getIdToken(true));
    } else {
      setSessionCookie(token);
    }
  } catch {
    // Il middleware gestira la sessione mancante al prossimo giro.
  }
}

/**
 * Guardia delle pagine protette. Fail-closed per contratto:
 * `user` resta null finche email verificata + profilo + Approved
 * (+ ruolo richiesto) non sono confermati. Le pagine non devono creare
 * query Firestore ne mostrare UI di ruolo prima di `ready`.
 */
export function useAuthGuard(requiredRole?: UserRole) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const checksDone = !isUserLoading && !isProfileLoading;
  const roleOk = !requiredRole || userProfile?.role === requiredRole || userProfile?.role === 'Admin';
  const ready =
    checksDone &&
    !!user &&
    user.emailVerified &&
    !!userProfile &&
    userProfile.status === 'Approved' &&
    roleOk;

  useEffect(() => {
    if (!checksDone) return;

    const revokeAndGo = async (target: string) => {
      clearSessionCookie();
      if (auth) {
        try {
          await signOut(auth);
        } catch {
          // Prosegui comunque col redirect.
        }
      }
      router.replace(target);
    };

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.emailVerified) {
      void revokeAndGo('/login');
      return;
    }

    if (!userProfile) {
      void revokeAndGo('/login');
      return;
    }

    if (userProfile.status === 'Pending' && !window.location.pathname.includes('pending-approval')) {
      router.replace('/pending-approval');
      return;
    }

    if (userProfile.status === 'Rejected') {
      void revokeAndGo('/rejected');
      return;
    }

    if (userProfile.status !== 'Approved') {
      void revokeAndGo('/login');
      return;
    }

    if (!roleOk) {
      router.replace('/dashboard');
      return;
    }

    // Solo qui, a TUTTI i controlli superati, si (ri)emette il cookie.
    void refreshSessionCookieIfNeeded(user);
  }, [user, userProfile, checksDone, roleOk, router, requiredRole, auth]);

  return {
    user: ready ? user : null,
    userProfile: ready ? userProfile : null,
    isLoading: !checksDone,
    ready,
  };
}
