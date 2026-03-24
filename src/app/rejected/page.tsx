'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden rounded-3xl">
          <div className="bg-destructive p-8 flex justify-center">
             <XCircle className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-headline font-bold text-primary">Profilo non Approvato</h2>
            <p className="text-slate-500 leading-relaxed">
              Spiacenti, la tua richiesta di accesso a Nexus Digital Bridge non è stata accolta. Ciò può accadere se i dati inseriti non sono risultati verificabili o conformi alle finalità della piattaforma.
            </p>
            <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-left">
              <Mail className="w-8 h-8 text-destructive" />
              <div className="text-sm">
                 <div className="font-bold text-red-800">Serve assistenza?</div>
                 <div className="text-red-600">Scrivi a emanueleadelini@gmail.com per chiarimenti.</div>
              </div>
            </div>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href="/">Torna alla Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}