'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';

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

    if (userProfile) {
      // Se l'utente è bloccato o pendente e cerca di entrare nella dashboard
      if (userProfile.status === 'Pending' && !window.location.pathname.includes('pending-approval')) {
        router.replace('/pending-approval');
        return;
      }

      if (userProfile.status === 'Rejected') {
        router.replace('/rejected');
        return;
      }

      // Controllo ruolo specifico
      if (requiredRole && userProfile.role !== requiredRole && userProfile.role !== 'Admin') {
        router.replace('/dashboard');
        return;
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, requiredRole]);

  return { 
    user, 
    userProfile, 
    isLoading: isUserLoading || isProfileLoading 
  };
}