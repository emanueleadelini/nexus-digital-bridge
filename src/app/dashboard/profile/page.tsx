
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Briefcase, Building2, MapPin, Globe, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isUserLoading } = useDoc(userRef);
  const role = (userProfile?.role?.toLowerCase() as "company" | "institute") || "company";

  const profileDetailsRef = useMemoFirebase(() => {
    if (!db || !user || !role) return null;
    const path = role === "company" ? "companies" : "institutes";
    return doc(db, path, user.uid);
  }, [db, user, role]);

  const { data: profileDetails } = useDoc(profileDetailsRef);

  const sectorsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "sectors");
  }, [db]);

  const typesRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "instituteTypes");
  }, [db]);

  const { data: availableSectors } = useCollection(sectorsRef);
  const { data: availableTypes } = useCollection(typesRef);

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileDetails) {
      setSelectedSectors(profileDetails.sectorIds || []);
      setSelectedTypes(profileDetails.types || []);
      setAddress(profileDetails.address || "");
      setBio(profileDetails.description || "");
    }
  }, [profileDetails]);

  const handleSave = async () => {
    if (!profileDetailsRef || !userRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileDetailsRef, {
        sectorIds: selectedSectors,
        address,
        description: bio,
        ...(role === 'institute' ? { types: selectedTypes } : {})
      });
      toast({ title: "Profilo aggiornato", description: "Le modifiche sono state salvate correttamente." });
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiornare il profilo." });
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-primary">
              Profilo {role === 'company' ? 'Aziendale' : 'Istituto'}
            </h1>
            <p className="text-slate-500">Completa le informazioni per migliorare il matching.</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-2xl flex items-center justify-center">
                {role === 'company' ? <Briefcase className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
              </div>
              <div>
                <CardTitle>{role === 'company' ? 'Dati di Visura' : 'Informazioni Generali'}</CardTitle>
                <CardDescription>Gestisci i tuoi dati operativi</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome {role === 'company' ? 'Azienda' : 'Istituto'}</Label>
                  <Input id="name" defaultValue={profileDetails?.name} className="rounded-xl" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="address" className="pl-10 rounded-xl" placeholder="Via Roma, 1, Milano" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
              </div>

              {role === 'institute' && (
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-primary">Tipologie di Istituto</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTypes?.map(type => (
                      <div 
                        key={type.id} 
                        onClick={() => toggleType(type.name)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${selectedTypes.includes(type.name) ? 'bg-secondary/10 border-secondary text-secondary font-bold' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTypes.includes(type.name) ? 'bg-secondary border-secondary text-white' : 'border-slate-300'}`}>
                          {selectedTypes.includes(type.name) && <Check className="w-2 h-2" />}
                        </div>
                        {type.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-lg font-bold text-primary">Settori Merceologici</Label>
                <p className="text-sm text-slate-500">
                  {role === 'company' 
                    ? "Seleziona i settori in cui operi. Gli studenti con questi tag appariranno nei tuoi match." 
                    : "I settori che definiscono l'orientamento formativo dell'istituto."}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSectors?.map(sector => (
                    <div 
                      key={sector.id} 
                      onClick={() => toggleSector(sector.name)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] cursor-pointer transition-all ${selectedSectors.includes(sector.name) ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <div className={`w-3 h-3 rounded-md border flex items-center justify-center ${selectedSectors.includes(sector.name) ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                        {selectedSectors.includes(sector.name) && <Check className="w-2 h-2" />}
                      </div>
                      {sector.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Descrizione Breve</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Racconta chi siete in poche righe..." className="min-h-[120px] rounded-xl" />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto px-8 bg-secondary hover:bg-secondary/90 text-white font-bold h-12 rounded-xl">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salva Profilo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
