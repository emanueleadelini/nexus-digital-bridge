
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Download,
  Building2,
  School,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuthGuard, useApiData, apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import type { MatchResult, InstituteMatchEntry, InterestedCompany } from "@/types";

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const isCompany = user?.role === "Company";

  const { data: matchesData, isLoading } = useApiData<MatchResult[] | InstituteMatchEntry[]>(
    user ? "/api/matches" : null,
    30_000
  );

  const matches = (matchesData || []) as (MatchResult | InstituteMatchEntry)[];

  const filteredMatches = useMemo(() => {
    if (!searchTerm) return matches;
    const term = searchTerm.toLowerCase();
    if (isCompany) {
      return (matches as MatchResult[]).filter(m =>
        m.student.name?.toLowerCase().includes(term) ||
        m.student.studentClass?.toLowerCase().includes(term) ||
        m.student.instituteName?.toLowerCase().includes(term) ||
        m.commonSectors.some(s => s.toLowerCase().includes(term)) ||
        m.student.cvInformation?.toLowerCase().includes(term)
      );
    }
    return (matches as InstituteMatchEntry[]).filter(e =>
      e.student.name?.toLowerCase().includes(term) ||
      e.interestedCompanies.some(c => c.companyName.toLowerCase().includes(term))
    );
  }, [matches, searchTerm, isCompany]);

  async function startChat(instituteId: string, studentCvId?: string) {
    setStartingChat(studentCvId || instituteId);
    const res = await apiFetch("/api/chats", { json: { instituteId, studentCvId } });
    setStartingChat(null);
    if (res.ok) {
      window.location.href = "/dashboard/chat";
    } else {
      toast({ variant: "destructive", title: "Chat non avviata", description: (res.data as { error?: string }).error || "Errore" });
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            <div className="h-9 w-72 bg-slate-200 rounded-xl" />
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
                {isCompany ? 'Matching Intelligente' : 'I Tuoi Match'}
              </h1>
              <p className="text-slate-500">
                {isCompany
                  ? "Talenti filtrati per i settori Confindustria della tua azienda."
                  : "Aziende interessate ai tuoi studenti, con punteggio di compatibilità."}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-100 px-4 py-2 rounded-full font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Algoritmo Nexus Attivo</span>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={isCompany ? "Filtra per nome, istituto o competenza..." : "Filtra per studente o azienda..."}
              className="pl-10 rounded-xl h-12 shadow-sm border-none bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isCompany ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredMatches as MatchResult[]).length > 0 ? (filteredMatches as MatchResult[]).map((match) => (
                <Card key={match.student.id} className="border-none shadow-xl hover:shadow-2xl transition-all group overflow-hidden bg-white rounded-3xl">
                  <div className={`h-2 ${match.matchScore >= 80 ? 'bg-green-500' : match.matchScore >= 50 ? 'bg-blue-500' : 'bg-secondary'}`} />
                  <CardHeader className="flex flex-row items-center gap-4 pt-6">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-md">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {match.student.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-2 border-white ${match.matchScore >= 80 ? 'bg-green-500' : 'bg-secondary'}`}>
                        {match.matchScore}%
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate group-hover:text-primary transition-colors">{match.student.name}</CardTitle>
                      <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                        <GraduationCap className="w-3 h-3 text-secondary" />
                        <span className="truncate">{match.student.studentClass}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5">
                        <School className="w-3 h-3" />
                        <span className="truncate">{match.student.instituteName || "Istituto"}</span>
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

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-12 border-slate-100 hover:bg-slate-50 font-bold shadow-sm"
                            onClick={() => setSelectedMatch(match)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Vedi CV
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[850px] p-0 rounded-[32px] border-none shadow-2xl">
                          {selectedMatch && <CvSheet match={selectedMatch} onChat={() => startChat(selectedMatch.student.instituteId, selectedMatch.student.id)} starting={startingChat === selectedMatch.student.id} />}
                        </DialogContent>
                      </Dialog>
                      <Button
                        className="rounded-2xl h-12 bg-slate-900 hover:bg-slate-800 text-white"
                        disabled={startingChat === match.student.id}
                        onClick={() => startChat(match.student.instituteId, match.student.id)}
                      >
                        {startingChat === match.student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <EmptyState text="Nessun match trovato" sub="Nessun CV corrisponde ai tuoi settori attuali. Espandi i settori nel profilo azienda." />
              )}
            </div>
          ) : (
            /* ===== Vista ISTITUTO: studenti × aziende interessate ===== */
            <div className="space-y-6">
              {(filteredMatches as InstituteMatchEntry[]).length > 0 ? (filteredMatches as InstituteMatchEntry[]).map((entry) => (
                <Card key={entry.student.id} className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-4 py-5">
                    <Avatar className="h-12 w-12 border-2 border-white shadow">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {entry.student.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{entry.student.name}</CardTitle>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-secondary" /> {entry.student.studentClass}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-primary border-none font-bold">
                      {entry.interestedCompanies.length} aziende interessate
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {entry.interestedCompanies.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {entry.interestedCompanies.map((c) => (
                          <div key={c.companyId} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${c.matchScore >= 80 ? 'bg-green-50 text-green-600' : c.matchScore >= 50 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                              {c.matchScore}%
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-700 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                {c.companyName}
                              </div>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {c.commonSectors.slice(0, 3).map(s => (
                                  <Badge key={s} variant="outline" className="text-[9px] text-slate-500 border-slate-200">{s}</Badge>
                                ))}
                              </div>
                            </div>
                            {c.chatStarted ? (
                              <Badge variant="secondary" className="bg-green-50 text-green-700 border-none">Chat attiva</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                disabled={startingChat === entry.student.id + c.companyId}
                                onClick={() => {
                                  setStartingChat(entry.student.id + c.companyId);
                                  apiFetch("/api/chats", { json: { companyId: c.companyId, studentCvId: entry.student.id } }).then((r) => {
                                    setStartingChat(null);
                                    if (r.ok) window.location.href = "/dashboard/chat";
                                    else toast({ variant: "destructive", title: "Chat non avviata", description: (r.data as { error?: string }).error || "" });
                                  });
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" /> Contatta
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-8">Nessuna azienda interessata per ora.</p>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <EmptyState text="Nessuno studente nel database" sub="Carica i CV dalla pagina Database Studenti per attivare il matching." />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CvSheet({ match, onChat, starting }: { match: MatchResult; onChat: () => void; starting: boolean }) {
  return (
    <div id="cv-document" className="flex flex-col bg-white print:bg-white">
      <DialogHeader className="p-6 bg-primary text-white border-b">
        <DialogTitle className="text-2xl font-headline">Scheda Talento: {match.student.name}</DialogTitle>
        <DialogDescription className="text-blue-100">
          {match.student.instituteName} — Match score {match.matchScore}%
        </DialogDescription>
      </DialogHeader>

      <div className="p-10 bg-primary text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl print:hidden" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl ring-4 ring-white/10">
              <AvatarFallback className="bg-slate-800 text-4xl">{match.student.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full w-fit">
                <Zap className="w-3 h-3 text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Top Match Talent</span>
              </div>
              <h2 className="text-4xl font-headline font-bold">{match.student.name}</h2>
              <p className="text-blue-100 flex items-center justify-center md:justify-start gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-secondary" /> {match.student.studentClass}
              </p>
              <p className="text-blue-200 text-sm flex items-center justify-center md:justify-start gap-2">
                <School className="w-4 h-4" /> {match.student.instituteName}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/10 backdrop-blur-xl px-8 py-6 rounded-[24px] text-center border border-white/10 shadow-2xl min-w-[140px]">
              <div className="text-[10px] font-bold uppercase opacity-70 tracking-[0.2em] mb-1">Match Score</div>
              <div className="text-5xl font-bold font-headline">{match.matchScore}%</div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" onClick={() => window.print()}>
                <Printer className="w-5 h-5" />
              </Button>
              {match.student.pdfPath && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" asChild>
                  <a href={`/api/cv/${match.student.id}/pdf`} target="_blank" rel="noopener">
                    <Download className="w-5 h-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-72 bg-slate-50 p-8 border-r border-slate-100 space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affinità Settori</h4>
            <div className="flex flex-wrap gap-2">
              {match.student.sectorIds.map(s => (
                <Badge
                  key={s}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-none shadow-sm ${match.commonSectors.includes(s) ? 'bg-secondary text-white' : 'bg-white text-slate-400'}`}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </section>
          {match.student.skills && match.student.skills.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competenze estratte</h4>
              <div className="flex flex-wrap gap-2">
                {match.student.skills.map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] border-slate-200 text-slate-500">{s}</Badge>
                ))}
              </div>
            </section>
          )}
          <div className="pt-6 border-t border-slate-200 print:hidden">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl shadow-xl" onClick={onChat} disabled={starting}>
              {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />} Contatta Istituto
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white">
          <div className="p-10 space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 font-headline">Esperienze e Competenze</h3>
              </div>
              <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line italic">
                  "{match.student.cvInformation}"
                </p>
              </div>
            </section>
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 font-headline">Perché questo punteggio</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <h5 className="font-bold text-xs text-primary uppercase mb-2">Settori in comune</h5>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {match.commonSectors.length > 0 ? match.commonSectors.join(", ") : "Nessuno"} — la copertura settoriale pesa il 90% del punteggio.
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <h5 className="font-bold text-xs text-secondary uppercase mb-2">Bonus competenze</h5>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Fino a +10% se il testo del CV cita i settori che cerchi anche senza tag esplicito.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
        <Search className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <p className="text-xl text-slate-600 font-bold">{text}</p>
        <p className="text-slate-400 max-w-sm mx-auto">{sub}</p>
      </div>
      <Button variant="outline" className="rounded-xl border-slate-200 px-8" asChild>
        <Link href="/dashboard/profile">Ottimizza Profilo</Link>
      </Button>
    </div>
  );
}
