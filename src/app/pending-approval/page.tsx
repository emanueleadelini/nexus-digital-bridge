'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/lib/api";

export default function PendingApprovalPage() {
  const { user } = useMe();
  const router = useRouter();

  // Poll leggero: quando l'admin approva, redirect automatico in dashboard
  useEffect(() => {
    if (user?.status === 'Approved') {
      router.push('/dashboard');
      return;
    }
    const t = setInterval(async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const me = await res.json();
        if (me?.user?.status === 'Approved') router.push('/dashboard');
        if (me?.user?.status === 'Rejected') router.push('/rejected');
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [user, router]);

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
              Ciao {user?.firstName || 'Utente'}, abbiamo ricevuto la tua richiesta. Il tuo profilo è attualmente in fase di verifica manuale.
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
