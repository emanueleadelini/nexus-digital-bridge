'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingApprovalPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    // Appena approvato, rimanda al login: serve una sessione nuova (cookie).
    if (profile?.status === 'Approved') {
      router.push('/login');
    }
  }, [profile, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden rounded-3xl">
          <div className="bg-secondary p-8 flex justify-center">
             <ShieldAlert className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-headline font-bold text-primary">Registrazione in Attesa</h2>
            <p className="text-slate-500 leading-relaxed">
              Ciao {profile?.firstName || 'Utente'}, abbiamo ricevuto la tua richiesta. Il tuo profilo è attualmente in fase di verifica manuale.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 text-left">
              <Clock className="w-10 h-10 text-secondary" />
              <div className="text-sm">
                 <div className="font-bold text-slate-800">Cosa succede ora?</div>
                 <div className="text-slate-500">Verificheremo i tuoi dati professionali. Riceverai un'email di conferma non appena sarai abilitato.</div>
              </div>
            </div>
            <Button className="w-full bg-primary text-white font-bold h-12 rounded-xl" asChild>
              <Link href="/">Torna alla Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}