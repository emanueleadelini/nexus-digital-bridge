
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Zap, 
  FileText, 
  GraduationCap, 
  Loader2,
  Search,
  CheckCircle2,
  Briefcase,
  Award,
  MessageSquare,
  Printer,
  Download
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from "@/firebase";
import { collectionGroup, doc } from "firebase/firestore";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MatchResult, StudentCV, CompanyProfile } from "@/types";

/**
 * Algoritmo di Matching Nexus 3.0
 * Calcola l'intersezione dei settori e aggiunge un bonus per le parole chiave trovate nel testo.
 */
function calculateMatchScore(student: StudentCV, companySectors: string[]): { score: number; common: string[] } {
  const studentSectors = student.sectorIds || [];
  if (!studentSectors.length || !companySectors.length) return { score: 0, common: [] };
  
  const common = companySectors.filter(s => studentSectors.includes(s));

  // Score base sulla copertura dei settori (max 90%) — bilanciato su entrambi i profili
  const sectorCoverage = common.length / Math.max(companySectors.length, studentSectors.length);
  let score = sectorCoverage * 90;

  // Bonus Intelligenza Testuale (max +10%)
  const untaggedCompanySectors = companySectors.filter(s => !studentSectors.includes(s));
  let bonus = 0;
  untaggedCompanySectors.forEach(s => {
    if (student.cvInformation?.toLowerCase().includes(s.toLowerCase())) {
      bonus += 5; 
    }
  });

  return { score: Math.min(Math.round(score + bonus), 100), common };
}

export default function MatchesPage() {
  const { user, userProfile, isLoading: authLoading } = useAuthGuard();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  // Aspettiamo che l'utente sia carico prima di creare i riferimenti
  const profileDetailsRef = useMemoFirebase(() => {
    if (!db || !user || !userProfile) return null;
    const path = userProfile.role === "Company" ? "companies" : "institutes";
    return doc(db, path, user.uid);
  }, [db, user, userProfile]);

  const { data: details, isLoading: detailsLoading } = useDoc(profileDetailsRef);

  const studentsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collectionGroup(db, "studentCVs");
  }, [db, user]);

  const { data: allStudents, isLoading: studentsLoading } = useCollection<StudentCV>(studentsRef);

  const matches = useMemo(() => {
    if (!userProfile || !allStudents || !details) return [];
    
    if (userProfile.role === "Company") {
      const companySectors = (details as CompanyProfile).sectorIds || [];
      return allStudents
        .filter(s => !s.isDemo)
        .map(student => {
          const { score, common } = calculateMatchScore(student, companySectors);
          return { student, matchScore: score, commonSectors: common } as MatchResult;
        })
        .filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    } else {
      return allStudents
        .filter(s => s.instituteId === user?.uid && !s.isDemo)
        .map(student => ({ student, matchScore: 100, commonSectors: student.sectorIds || [] }));
    }
  }, [userProfile, allStudents, details, user]);

  const filteredMatches = useMemo(() => {
    if (!searchTerm) return matches;
    const term = searchTerm.toLowerCase();
    return matches.filter(m =>
      m.student.name.toLowerCase().includes(term) ||
      m.student.class?.toLowerCase().includes(term) ||
      m.commonSectors.some(s => s.toLowerCase().includes(term)) ||
      m.student.cvInformation?.toLowerCase().includes(term)
    );
  }, [matches, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || detailsLoading || studentsLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-9 w-72 bg-slate-200 rounded-xl" />
                <div className="h-4 w-48 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-9 w-48 bg-green-100 rounded-full" />
            </div>
            <div className="h-12 w-80 bg-slate-200 rounded-xl" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-3xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">
                {userProfile?.role === 'Company' ? 'Matching Intelligente' : 'I Tuoi Studenti'}
              </h1>
              <p className="text-slate-500">
                Talenti filtrati per i settori Confindustria della tua azienda.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-100 px-4 py-2 rounded-full font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Algoritmo Nexus v3.0 Attivo</span>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filtra per nome o competenza..." 
              className="pl-10 rounded-xl h-12 shadow-sm border-none bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.length > 0 ? filteredMatches.map((match) => (
              <Card key={match.student.id} className="border-none shadow-xl hover:shadow-2xl transition-all group overflow-hidden bg-white rounded-3xl">
                <div className={`h-2 ${match.matchScore >= 80 ? 'bg-green-500' : match.matchScore >= 50 ? 'bg-blue-500' : 'bg-secondary'}`} />
                <CardHeader className="flex flex-row items-center gap-4 pt-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${match.student.id}/100/100`} />
                      <AvatarFallback>{match.student.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-2 border-white ${match.matchScore >= 80 ? 'bg-green-500' : 'bg-secondary'}`}>
                      {match.matchScore}%
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate group-hover:text-primary transition-colors">{match.student.name}</CardTitle>
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                       <GraduationCap className="w-3 h-3 text-secondary" />
                       <span className="truncate">{match.student.class}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settori in Comune</div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.commonSectors.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="bg-blue-50 text-primary border-none text-[10px] font-bold">
                          {s}
                        </Badge>
                      ))}
                      {match.commonSectors.length > 3 && (
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400">
                          +{match.commonSectors.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-2xl h-12 border-slate-100 hover:bg-slate-50 font-bold shadow-sm"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Vedi CV Completo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[850px] p-0 rounded-[32px] border-none shadow-2xl">
                      {selectedMatch && (
                        <div id="cv-document" className="flex flex-col bg-white print:bg-white">
                          <style jsx global>{`
                            @media print {
                              body * { visibility: hidden; }
                              #cv-document, #cv-document * { visibility: visible; }
                              #cv-document { position: absolute; left: 0; top: 0; width: 100%; height: auto; }
                              .print-hidden { display: none !important; }
                              .print-full-width { width: 100% !important; border: none !important; }
                              .dialog-close-btn { display: none !important; }
                            }
                          `}</style>
                          <DialogHeader className="p-6 bg-primary text-white border-b print:bg-slate-900">
                            <DialogTitle className="text-2xl font-headline">Scheda Talento: {selectedMatch.student.name}</DialogTitle>
                            <DialogDescription className="text-blue-100">Dettaglio delle competenze e score di matching ({selectedMatch.matchScore}%).</DialogDescription>
                          </DialogHeader>
                          
                          <div className="p-10 bg-primary text-white relative overflow-hidden print:bg-slate-900">
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl print:hidden" />
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl ring-4 ring-white/10 print:ring-0">
                                  <AvatarImage src={`https://picsum.photos/seed/${selectedMatch.student.id}/200/200`} />
                                  <AvatarFallback className="bg-slate-800 text-4xl">{selectedMatch.student.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-center md:justify-start gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full w-fit print:border print:border-white/20">
                                    <Zap className="w-3 h-3 text-secondary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Top Match Talent</span>
                                  </div>
                                  <h2 className="text-4xl font-headline font-bold">{selectedMatch.student.name}</h2>
                                  <p className="text-blue-100 flex items-center justify-center md:justify-start gap-2 text-lg">
                                    <GraduationCap className="w-5 h-5 text-secondary" /> {selectedMatch.student.class}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-4">
                                <div className="bg-white/10 backdrop-blur-xl px-8 py-6 rounded-[24px] text-center border border-white/10 shadow-2xl min-w-[140px] print:bg-white/5">
                                  <div className="text-[10px] font-bold uppercase opacity-70 tracking-[0.2em] mb-1">Match Score</div>
                                  <div className="text-5xl font-bold font-headline">{selectedMatch.matchScore}%</div>
                                </div>
                                <div className="flex gap-2 print:hidden">
                                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" onClick={handlePrint}>
                                    <Printer className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col md:flex-row print:flex-row">
                            <div className="w-full md:w-72 bg-slate-50 p-8 border-r border-slate-100 space-y-8 print:w-64">
                              <section className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affinità Settori</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedMatch.student.sectorIds.map(s => (
                                    <Badge 
                                      key={s} 
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-none shadow-sm transition-all ${selectedMatch.commonSectors.includes(s) ? 'bg-secondary text-white' : 'bg-white text-slate-400'}`}
                                    >
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              </section>

                              <div className="pt-6 border-t border-slate-200 print:hidden">
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl shadow-xl transition-transform active:scale-95" asChild>
                                  <Link href={`/dashboard/chat?student=${selectedMatch.student.id}&institute=${selectedMatch.student.instituteId}`}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Contatta Istituto
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            <div className="flex-1 bg-white print:overflow-visible">
                              <div className="p-10 space-y-10">
                                <section className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shadow-inner">
                                      <Briefcase className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 font-headline">Esperienze e Competenze</h3>
                                  </div>
                                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line serif italic">
                                      "{selectedMatch.student.cvInformation}"
                                    </p>
                                  </div>
                                </section>

                                <section className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shadow-inner">
                                      <Award className="w-5 h-5 text-secondary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 font-headline">Certificazioni & Soft Skills</h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                                    <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                      <h5 className="font-bold text-xs text-primary uppercase mb-2">Formazione</h5>
                                      <p className="text-sm text-slate-500 leading-relaxed">Profilo scolastico di alto livello specializzato nel settore {selectedMatch.commonSectors[0] || 'tecnico'}.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                      <h5 className="font-bold text-xs text-secondary uppercase mb-2">Punti di Forza</h5>
                                      <p className="text-sm text-slate-500 leading-relaxed">Forte compatibilità ({selectedMatch.matchScore}%) con i requisiti della tua azienda.</p>
                                    </div>
                                  </div>
                                </section>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl text-slate-600 font-bold">Nessun match perfetto trovato</p>
                  <p className="text-slate-400 max-w-sm mx-auto">Abbiamo analizzato migliaia di profili ma nessuno corrisponde ai tuoi filtri attuali. Prova a espandere i tuoi settori nel profilo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
