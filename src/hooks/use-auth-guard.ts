'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';
import { setSessionCookie } from '@/lib/session-cookie';

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
 * Hook per proteggere le rotte della dashboard e gestire i redirect in base allo stato dell'utente.
 */
export function useAuthGuard(requiredRole?: UserRole) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Fail-closed: senza email verificata non si entra da nessuna parte.
    if (!user.emailVerified) {
      router.replace('/login');
      return;
    }

    // Fail-closed: senza profilo leggibile non si entra (niente default).
    if (!userProfile) {
      router.replace('/login');
      return;
    }

    // Solo qui, a controlli superati, si (ri)emette il cookie di sessione.
    void refreshSessionCookieIfNeeded(user);

    // Se l'utente è bloccato o pendente e cerca di entrare nella dashboard
    if (userProfile.status === 'Pending' && !window.location.pathname.includes('pending-approval')) {
      router.replace('/pending-approval');
      return;
    }

    if (userProfile.status === 'Rejected') {
      router.replace('/rejected');
      return;
    }

    if (userProfile.status !== 'Approved') {
      router.replace('/login');
      return;
    }

    // Controllo ruolo specifico
    if (requiredRole && userProfile.role !== requiredRole && userProfile.role !== 'Admin') {
      router.replace('/dashboard');
      return;
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, requiredRole]);

  return { 
    user, 
    userProfile, 
    isLoading: isUserLoading || isProfileLoading 
  };
}