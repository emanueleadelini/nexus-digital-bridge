
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setSessionCookie, clearSessionCookie } from "@/lib/session-cookie";

/** Destinazioni interne consentite per il parametro ?redirect= (anti open-redirect). */
function safeRedirectTarget(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw.startsWith('/login') || raw.startsWith('/register')) return null;
  return raw;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const db = useFirestore();

  const handleResendVerification = async () => {
    if (!auth?.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "Email inviata", description: "Controlla la tua casella e poi accedi di nuovo." });
    } catch {
      toast({ variant: "destructive", title: "Invio fallito", description: "Riprova tra qualche minuto." });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setIsLoading(true);
    setAuthError(null);
    setNeedsVerification(false);

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // Fail-closed: senza profilo o senza approvazione non si entra da nessuna parte.
      if (!userDoc.exists() || !userData) {
        await signOut(auth);
        clearSessionCookie();
        setAuthError("Profilo non trovato. Completa la registrazione o contatta il supporto.");
        return;
      }

      if (!user.emailVerified) {
        // Resta fermo al login (niente cookie, niente redirect): solo verifica.
        setAuthError("Devi verificare la tua email prima di accedere. Controlla la casella (anche lo spam).");
        setNeedsVerification(true);
        return;
      }

      if (userData.status === "Pending") {
        router.push("/pending-approval");
      } else if (userData.status === "Rejected") {
        router.push("/rejected");
      } else if (userData.status !== "Approved") {
        await signOut(auth);
        clearSessionCookie();
        setAuthError("Account non attivo. Contatta il supporto.");
        return;
      } else {
        // Solo gli approvati ricevono il cookie di sessione.
        try {
          setSessionCookie(await user.getIdToken());
        } catch {
          // Senza cookie ci pensano middleware + useAuthGuard al primo accesso.
        }
        const redirect = safeRedirectTarget(searchParams.get("redirect"));
        if (userData.role === "Admin") {
          router.push(redirect && redirect.startsWith("/admin") ? redirect : "/admin");
        } else if (redirect && redirect.startsWith("/dashboard")) {
          router.push(redirect);
        } else {
          router.push("/dashboard");
        }
      }
      toast({ title: "Accesso effettuato", description: "Benvenuto su Nexus Digital Bridge." });

    } catch (error: unknown) {

      const firebaseError = error as { code?: string };
      let message = "Credenziali non valide. Riprova.";

      if (
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/wrong-password'
      ) {
        message = "Email o password errati. Controlla le credenziali e riprova.";
      } else if (firebaseError.code === 'auth/too-many-requests') {
        message = "Troppi tentativi. Aspetta qualche minuto o reimposta la password.";
      }

      setAuthError(message);
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: message,
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
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Accesso Nexus</CardTitle>
            <CardDescription>Inserisci le tue credenziali per entrare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {authError && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attenzione</AlertTitle>
                <AlertDescription className="text-xs">
                  {authError}
                </AlertDescription>
                {needsVerification && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleResendVerification}
                  >
                    Reinvia email di verifica
                  </Button>
                )}
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Indirizzo Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@esempio.it"
                  required
                  maxLength={254}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                    Dimenticata?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-lg">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entra nella Dashboard"}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-500">
              Non hai ancora un account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Registrati qui
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
