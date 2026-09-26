
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Password troppo corta", description: "Minimo 8 caratteri." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Le password non coincidono" });
      return;
    }
    setIsLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Link scaduto o non valido", description: "Richiedi un nuovo link di reset." });
      return;
    }
    toast({ title: "Password aggiornata", description: "Ora puoi accedere con la nuova password." });
    router.push("/login");
  };

  if (!token) {
    return (
      <CardContent className="py-10 text-center text-slate-500">
        Link non valido. <Link href="/forgot-password" className="text-primary font-bold">Richiedine uno nuovo</Link>.
      </CardContent>
    );
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">Nuova Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="rounded-xl pr-12" />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Conferma Password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="rounded-xl" />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-lg">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Imposta Nuova Password"}
        </Button>
      </form>
    </CardContent>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Nuova Password</CardTitle>
            <CardDescription>Scegli una nuova password per il tuo account</CardDescription>
          </CardHeader>
          <Suspense fallback={<CardContent className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></CardContent>}>
            <ResetForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
