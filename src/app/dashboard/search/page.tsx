
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Search, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Mail, 
  FileText, 
  User, 
  MessageSquare,
  Award,
  Loader2,
  Briefcase,
  Zap,
  Printer,
  Download
} from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, addDoc } from "firebase/firestore";

export default function SearchInstitutesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedInstitute, setSelectedInstitute] = useState<any | null>(null);
  const [selectedStudentForCV, setSelectedStudentForCV] = useState<any | null>(null);
  const { toast } = useToast();

  const institutesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "institutes");
  }, [db, user]);

  const typesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "instituteTypes");
  }, [db, user]);

  const { data: institutes, isLoading } = useCollection(institutesRef);
  const { data: availableTypes } = useCollection(typesRef);

  const filteredInstitutes = useMemo(() => {
    if (!institutes) return [];
    return institutes.filter(inst => {
      if (inst.isDemo) return false;
      const matchesSearch = inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inst.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || inst.types?.includes(filterType);
      return matchesSearch && matchesType;
    });
  }, [searchTerm, filterType, institutes]);

  // Hook per caricare i CV dello studente selezionato
  const studentsRef = useMemoFirebase(() => {
    if (!db || !selectedInstitute || !user) return null;
    return collection(db, "institutes", selectedInstitute.id, "studentCVs");
  }, [db, selectedInstitute, user]);

  const { data: students, isLoading: loadingStudents } = useCollection(studentsRef);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Cerca Istituti</h1>
              <p className="text-slate-500">Esplora gli istituti partner e scopri i profili dei loro studenti.</p>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              <GraduationCap className="w-8 h-8 text-secondary" />
            </div>
          </div>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    placeholder="Cerca per nome istituto o città..." 
                    className="pl-10 h-12 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Tutte le tipologie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le tipologie</SelectItem>
                    {availableTypes?.map(type => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutes.length > 0 ? (
              filteredInstitutes.map((inst) => (
                <Card key={inst.id} className="border-none shadow-md hover:shadow-xl transition-all group flex flex-col">
                  <CardHeader className="flex flex-row items-start gap-4 pb-4">
                    <Avatar className="h-14 w-14 rounded-2xl">
                      <AvatarImage src={`https://picsum.photos/seed/inst-${inst.id}/100/100`} />
                      <AvatarFallback className="bg-blue-100 text-primary font-bold">
                        {inst.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {inst.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        {inst.address || "Località non specificata"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="flex flex-wrap gap-1">
                      {inst.types?.map((type: string) => (
                        <Badge key={type} variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                          {type}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-4 border-t flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        {inst.email || "Email non disponibile"}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full mt-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-10"
                          onClick={() => setSelectedInstitute(inst)}
                        >
                          Vedi Database Studenti
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none">
                        <DialogHeader className="p-6 bg-primary text-white">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white/20 shadow-lg">
                              <AvatarImage src={`https://picsum.photos/seed/inst-${inst.id}/100/100`} />
                              <AvatarFallback>{inst.name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <DialogTitle className="text-2xl font-headline text-white">{inst.name}</DialogTitle>
                              <DialogDescription className="text-blue-100">
                                {inst.types?.join(", ")} - Database CV
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-6 bg-slate-50">
                          {loadingStudents ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
                          ) : (
                            <ScrollArea className="h-[450px] pr-4">
                              <div className="grid gap-4">
                                {students && students.length > 0 ? (
                                  students.map((student) => (
                                    <div 
                                      key={student.id} 
                                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-all shadow-sm group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary shadow-inner">
                                          <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-900">{student.name}</div>
                                          <div className="text-xs text-slate-500 mb-1">{student.class}</div>
                                          <div className="flex flex-wrap gap-1">
                                            {student.sectorIds?.map((s: string) => (
                                              <Badge key={s} variant="secondary" className="text-[9px] h-4 px-1.5 bg-orange-50 text-orange-600 border-none">
                                                {s}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button 
                                              variant="outline" 
                                              className="rounded-xl border-primary/20 text-primary hover:bg-blue-50 gap-2 h-10 px-4 shadow-sm"
                                              onClick={() => setSelectedStudentForCV(student)}
                                            >
                                              <FileText className="w-4 h-4" />
                                              <span>CV Completo</span>
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-[850px] max-h-[90vh] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
                                            {selectedStudentForCV && (
                                              <div className="flex flex-col h-full bg-white print:bg-white">
                                                <DialogHeader className="p-6 bg-slate-900 text-white border-b">
                                                  <DialogTitle className="text-2xl font-headline">Curriculum Vitae: {selectedStudentForCV.name}</DialogTitle>
                                                  <DialogDescription className="text-slate-400">Dettagli anagrafici e professionali estratti tramite IA.</DialogDescription>
                                                </DialogHeader>
                                                
                                                {/* Header Professionale del CV */}
                                                <div className="p-10 bg-slate-900 text-white relative overflow-hidden print:bg-slate-900">
                                                  <div className="absolute top-0 right-0 p-8 opacity-10 print:hidden">
                                                    <GraduationCap className="w-40 h-40" />
                                                  </div>
                                                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                                    <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl ring-4 ring-primary/20 print:ring-0">
                                                      <AvatarImage src={`https://picsum.photos/seed/student-${selectedStudentForCV.id}/300/300`} />
                                                      <AvatarFallback className="bg-primary text-4xl font-bold">
                                                        {selectedStudentForCV.name.split(' ').map((n: string) => n[0]).join('')}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-3 flex-1">
                                                      <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-secondary/30 print:border-white/20">
                                                        <Zap className="w-3 h-3" /> Talent Profile
                                                      </div>
                                                      <h2 className="text-4xl md:text-5xl font-headline font-bold leading-tight">{selectedStudentForCV.name}</h2>
                                                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-100/80">
                                                        <span className="flex items-center gap-2 text-lg">
                                                          <GraduationCap className="w-5 h-5 text-secondary" />
                                                          {selectedStudentForCV.class}
                                                        </span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block" />
                                                        <span className="flex items-center gap-2">
                                                          <Building2 className="w-4 h-4" />
                                                          {inst.name}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="flex gap-2 print:hidden">
                                                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" onClick={handlePrint}>
                                                        <Printer className="w-5 h-5" />
                                                      </Button>
                                                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" onClick={handlePrint}>
                                                        <Download className="w-5 h-5" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Corpo del CV */}
                                                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                                  {/* Sidebar info */}
                                                  <div className="w-full md:w-72 bg-slate-50 p-8 border-r border-slate-100 space-y-8 print:w-64">
                                                    <section className="space-y-4">
                                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Settori Target</h4>
                                                      <div className="flex flex-wrap gap-2">
                                                        {selectedStudentForCV.sectorIds?.map((s: string) => (
                                                          <Badge key={s} className="bg-white text-primary border border-blue-100 shadow-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">
                                                            {s}
                                                          </Badge>
                                                        ))}
                                                      </div>
                                                    </section>
                                                    
                                                    <div className="p-6 bg-primary rounded-2xl text-white space-y-4 shadow-xl shadow-blue-100 print:hidden">
                                                       <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                          <MessageSquare className="w-5 h-5 text-secondary" />
                                                       </div>
                                                       <div className="space-y-1">
                                                          <h4 className="font-bold text-sm">Interessato al profilo?</h4>
                                                          <p className="text-[10px] text-blue-100 leading-relaxed">Inizia una chat diretta con il referente dell'istituto.</p>
                                                       </div>
                                                       <Button className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl h-10 text-xs shadow-lg shadow-orange-900/20" asChild>
                                                          <Link href={`/dashboard/chat?student=${selectedStudentForCV.id}&institute=${inst.id}`}>
                                                            Contatta Istituto
                                                          </Link>
                                                       </Button>
                                                    </div>
                                                  </div>

                                                  {/* Contenuto Principale */}
                                                  <ScrollArea className="flex-1 bg-white print:overflow-visible">
                                                    <div className="p-10 space-y-10">
                                                      <section className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                            <Briefcase className="w-4 h-4 text-primary" />
                                                          </div>
                                                          <h3 className="text-xl font-bold text-slate-800 font-headline uppercase tracking-tight">Sintesi Professionale</h3>
                                                        </div>
                                                        <div className="p-1 bg-slate-50/50 rounded-2xl">
                                                          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                                            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg italic serif">
                                                              "{selectedStudentForCV.cvInformation}"
                                                            </p>
                                                          </div>
                                                        </div>
                                                      </section>

                                                      <section className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                                            <Award className="w-4 h-4 text-secondary" />
                                                          </div>
                                                          <h3 className="text-xl font-bold text-slate-800 font-headline uppercase tracking-tight">Hard Skills & Formazione</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                                                           <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-2">
                                                              <h5 className="font-bold text-xs text-primary uppercase">Percorso Scolastico</h5>
                                                              <p className="text-sm text-slate-500">Iscritto regolarmente al corso {selectedStudentForCV.class} presso l'istituto {inst.name}.</p>
                                                           </div>
                                                           <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-2">
                                                              <h5 className="font-bold text-xs text-secondary uppercase">Competenze IA</h5>
                                                              <p className="text-sm text-slate-500">Profilo analizzato e validato dal motore Nexus Bridge 2026.</p>
                                                           </div>
                                                        </div>
                                                      </section>
                                                    </div>
                                                  </ScrollArea>
                                                </div>
                                              </div>
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-12 text-center text-slate-400">Nessun CV caricato per questo istituto.</div>
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">Nessun istituto trovato.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
