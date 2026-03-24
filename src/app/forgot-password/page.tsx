
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { auth } = useFirebase();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email inviata",
        description: `Abbiamo inviato le istruzioni per il reset della password a ${email}`,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      toast({
        variant: "destructive",
        title: "Errore",
        description:
          code === "auth/user-not-found"
            ? "Nessun account trovato con questa email."
            : "Impossibile inviare l'email. Riprova più tardi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Reset Password</CardTitle>
            <CardDescription>Inserisci la tua email per ricevere un link di ripristino</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email dell'Account</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@esempio.it" 
                  required 
                  className="rounded-xl" 
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-lg">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Invia Link di Reset"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Ti sei ricordato?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Torna al Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
