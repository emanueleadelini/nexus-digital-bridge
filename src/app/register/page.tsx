
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, GraduationCap, Loader2, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";
import { doc, collection, serverTimestamp, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { notifyAdminOfNewUser, sendWelcomePendingEmail } from "@/app/actions/notifications";

// Rimuove caratteri HTML pericolosi per prevenire XSS
const sanitize = (str: string) => str.replace(/[<>"'`]/g, '').trim();

export default function RegisterPage() {
  const [role, setRole] = useState<string>("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const sectorsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "sectors");
  }, [db]);

  const typesRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "instituteTypes");
  }, [db]);

  const { data: availableSectors, isLoading: loadingSectors } = useCollection(sectorsRef);
  const { data: availableTypes, isLoading: loadingTypes } = useCollection(typesRef);

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    // Valida ruolo: solo 'company' o 'institute' sono ammessi
    const allowedRoles = ['company', 'institute'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      toast({ variant: "destructive", title: "Errore", description: "Tipo di account non valido." });
      return;
    }

    if (!acceptedTerms) {
      toast({ variant: "destructive", title: "Azione necessaria", description: "Accetta i Termini di Servizio." });
      return;
    }

    if (password.length < 8) {
      toast({ variant: "destructive", title: "Password troppo corta", description: "La password deve contenere almeno 8 caratteri." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Password diverse", description: "I due campi password non coincidono." });
      return;
    }

    if (selectedSectors.length === 0) {
      toast({ variant: "destructive", title: "Settori mancanti", description: "Seleziona almeno un settore." });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      const userRole = role.charAt(0).toUpperCase() + role.slice(1);
      const displayName = sanitize(role === "company" ? companyName : instituteName);

      // Scrittura atomica: profilo utente e dati specifici ruolo
      const profilePath = role === "company" ? "companies" : "institutes";
      const profileData: Record<string, unknown> = {
        id: user.uid,
        name: displayName,
        email: email.trim().toLowerCase(),
        status: "Pending",
        sectorIds: selectedSectors,
        createdAt: serverTimestamp(),
      };

      if (role === "institute") {
        profileData.types = selectedTypes;
      }

      // Scrittura atomica (batch): profilo utente + dati ruolo, o niente.
      const batch = writeBatch(db);
      batch.set(doc(db, "users", user.uid), {
        id: user.uid,
        email: email.trim().toLowerCase(),
        role: userRole,
        status: "Pending",
        firstName: sanitize(firstName),
        lastName: sanitize(lastName),
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, profilePath, user.uid), profileData);
      try {
        await batch.commit();
      } catch (batchError) {
        // Compensazione: senza profilo, l'account Auth resterebbe orfano.
        console.error("Registrazione: batch Firestore fallito, rimuovo l'account Auth.", batchError);
        try {
          await deleteUser(user);
        } catch {
          console.error("Registrazione: impossibile rimuovere l'account orfano, serve pulizia admin.");
        }
        throw batchError;
      }

      notifyAdminOfNewUser({ email: email.trim().toLowerCase(), role: userRole, name: displayName }).catch((err) => {
        console.error("Registrazione: notifica admin fallita.", err);
      });
      sendWelcomePendingEmail(email.trim().toLowerCase(), firstName.trim()).catch((err) => {
        console.error("Registrazione: email di benvenuto fallita.", err);
      });

      // Email di verifica (non bloccante: l'accesso resta legato all'approvazione admin).
      try {
        await sendEmailVerification(user);
      } catch {
        // Se l'invio fallisce, la registrazione resta valida.
      }

      // Niente cookie di sessione: i Pending non passano il middleware.
      // Dopo l'approvazione, il primo login rilascia il cookie.
      toast({ title: "Registrazione avvenuta", description: "Verifica la tua email, poi attendi l'approvazione." });
      router.push("/pending-approval");
    } catch (error: unknown) {
      const firebaseError = error as { message?: string; code?: string };
      let message = firebaseError.message || "Errore durante la registrazione.";
      if (firebaseError.code === 'auth/email-already-in-use') {
        message = "Questa email è già registrata. Prova ad accedere.";
      } else if (firebaseError.code === 'auth/weak-password') {
        message = "Password troppo debole. Usa almeno 8 caratteri.";
      }
      toast({ variant: "destructive", title: "Errore registrazione", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigurationMissing = (!loadingSectors && (!availableSectors || availableSectors.length === 0)) ||
    (!loadingTypes && role === 'institute' && (!availableTypes || availableTypes.length === 0));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50">
        <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center space-y-2 bg-primary text-white py-10">
            <CardTitle className="text-3xl font-headline font-bold">Crea il tuo Account</CardTitle>
            <CardDescription className="text-blue-100">Unisciti alla rete Nexus Digital Bridge</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {isConfigurationMissing ? (
              <div className="space-y-6 text-center py-12">
                <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary">Configurazione in corso</h3>
                  <p className="text-slate-500">L'amministratore sta inizializzando il sistema. Riprova tra pochi istanti.</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">Aggiorna</Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base font-bold text-primary">Tipo di Account</Label>
                  <RadioGroup defaultValue="company" onValueChange={setRole} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="role-company" className={`flex flex-col items-center justify-between rounded-2xl border-2 p-4 bg-popover hover:bg-accent transition-all cursor-pointer ${role === 'company' ? 'border-primary bg-blue-50' : 'border-muted opacity-60'}`}>
                      <RadioGroupItem value="company" id="role-company" className="sr-only" />
                      <Briefcase className={`mb-3 h-8 w-8 ${role === 'company' ? 'text-primary' : 'text-slate-400'}`} />
                      <span className={`font-bold ${role === 'company' ? 'text-primary' : 'text-slate-500'}`}>Azienda</span>
                    </Label>
                    <Label htmlFor="role-institute" className={`flex flex-col items-center justify-between rounded-2xl border-2 p-4 bg-popover hover:bg-accent transition-all cursor-pointer ${role === 'institute' ? 'border-primary bg-blue-50' : 'border-muted opacity-60'}`}>
                      <RadioGroupItem value="institute" id="role-institute" className="sr-only" />
                      <GraduationCap className={`mb-3 h-8 w-8 ${role === 'institute' ? 'text-primary' : 'text-slate-400'}`} />
                      <span className={`font-bold ${role === 'institute' ? 'text-primary' : 'text-slate-500'}`}>Istituto</span>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-bold text-primary">Dati Referente</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome</Label>
                      <Input id="firstName" required maxLength={50} className="rounded-xl" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Cognome</Label>
                      <Input id="lastName" required maxLength={50} className="rounded-xl" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Istituzionale</Label>
                      <Input id="email" type="email" required maxLength={254} className="rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-slate-400 font-normal">(min. 8 caratteri)</span></Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} className="rounded-xl pr-12" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Conferma Password</Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} className="rounded-xl pr-12" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-bold text-primary">{role === "company" ? "Dati Aziendali" : "Dati Istituto"}</Label>
                  <div className="space-y-2">
                    <Label htmlFor="entityName">{role === "company" ? "Ragione Sociale" : "Nome Istituto"}</Label>
                    <Input id="entityName" required maxLength={150} className="rounded-xl" value={role === "company" ? companyName : instituteName} onChange={(e) => role === "company" ? setCompanyName(e.target.value) : setInstituteName(e.target.value)} />
                  </div>

                  {role === "institute" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Tipologie (Selezione Multipla)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableTypes?.map(type => (
                          <div key={type.id} onClick={() => toggleType(type.name)} className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${selectedTypes.includes(type.name) ? 'bg-secondary/10 border-secondary text-secondary font-bold' : 'bg-white hover:bg-slate-50'}`}>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTypes.includes(type.name) ? 'bg-secondary border-secondary text-white' : 'border-slate-300'}`}>
                              {selectedTypes.includes(type.name) && <Check className="w-2 h-2" />}
                            </div>
                            {type.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Settori Merceologici</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSectors?.map(sector => (
                        <div key={sector.id} onClick={() => toggleSector(sector.name)} className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] cursor-pointer transition-all ${selectedSectors.includes(sector.name) ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white hover:bg-slate-50'}`}>
                          <div className={`w-3 h-3 rounded-md border flex items-center justify-center ${selectedSectors.includes(sector.name) ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                            {selectedSectors.includes(sector.name) && <Check className="w-2 h-2" />}
                          </div>
                          {sector.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pt-4 border-t">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-1" />
                  <Label htmlFor="terms" className="text-xs text-slate-500 cursor-pointer">Accetto Privacy Policy e Termini di Servizio.</Label>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl text-lg shadow-xl shadow-primary/10">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `Invia Registrazione`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
