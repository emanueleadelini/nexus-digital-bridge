
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Loader2,
  Zap,
  Printer,
  Download
} from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard, useApiData, apiFetch } from "@/lib/api";
import type { InstituteProfile, StudentCV } from "@/types";

interface Named { id: string; name: string }

export default function SearchInstitutesPage() {
  const { user } = useAuthGuard("Company");
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteProfile | null>(null);
  const [selectedStudentForCV, setSelectedStudentForCV] = useState<StudentCV | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const { data: institutes, isLoading } = useApiData<InstituteProfile[]>(
    user ? "/api/search/institutes" : null
  );
  const { data: availableTypes } = useApiData<Named[]>("/api/institute-types");

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

                    <div className="flex gap-2 pt-2">
                      <InstituteStudentsDialog
                        inst={inst}
                        onSelect={() => setSelectedInstitute(inst)}
                        onChat={startChat}
                        startingChat={startingChat}
                      />
                      <Button
                        variant="outline"
                        className="rounded-xl h-10 px-4"
                        disabled={startingChat === inst.id}
                        onClick={() => startChat(inst.id)}
                        title="Contatta l'istituto per informazioni generali"
                      >
                        {startingChat === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400">Nessun istituto trovato.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Dialog: database studenti di un istituto con % match calcolate lato server. */
function InstituteStudentsDialog({
  inst,
  onSelect,
  onChat,
  startingChat,
}: {
  inst: InstituteProfile;
  onSelect: () => void;
  onChat: (instituteId: string, studentCvId?: string) => void;
  startingChat: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentCV | null>(null);

  const { data: students, isLoading } = useApiData<StudentCV[]>(
    open ? `/api/search/institutes/${inst.id}` : null
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) onSelect(); }}>
      <DialogTrigger asChild>
        <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-10">
          Vedi Database Studenti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none">
        <DialogHeader className="p-6 bg-primary text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white/20 shadow-lg">
              <AvatarFallback className="bg-primary text-white">{inst.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <DialogTitle className="text-2xl font-headline text-white">{inst.name}</DialogTitle>
              <DialogDescription className="text-blue-100">
                {inst.types?.join(", ")} — Database CV con match score
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-6 bg-slate-50">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <ScrollArea className="h-[450px] pr-4">
              <div className="grid gap-4">
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${
                          (student.matchScore || 0) >= 80 ? "bg-green-50 text-green-600" :
                          (student.matchScore || 0) >= 50 ? "bg-blue-50 text-blue-600" :
                          "bg-slate-50 text-slate-500"
                        }`}>
                          {student.matchScore !== undefined ? `${student.matchScore}%` : <User className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500 mb-1">{student.studentClass}</div>
                          <div className="flex flex-wrap gap-1">
                            {student.sectorIds?.map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className={`text-[9px] h-4 px-1.5 border-none ${student.commonSectors?.includes(s) ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"}`}
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl border-primary/20 text-primary hover:bg-blue-50 gap-2 h-10 px-4 shadow-sm"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <FileText className="w-4 h-4" />
                          <span>CV</span>
                        </Button>
                        <Button
                          className="rounded-xl h-10 px-3 bg-slate-900 hover:bg-slate-800 text-white"
                          disabled={startingChat === student.id}
                          onClick={() => onChat(inst.id, student.id)}
                          title="Contatta l'istituto su questo studente"
                        >
                          {startingChat === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-12">Questo istituto non ha ancora caricato CV.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* CV detail nested dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(v) => !v && setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-[850px] max-h-[90vh] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
            {selectedStudent && (
              <div className="flex flex-col h-full bg-white">
                <DialogHeader className="p-6 bg-slate-900 text-white border-b">
                  <DialogTitle className="text-2xl font-headline">Curriculum Vitae: {selectedStudent.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {inst.name} — Match con la tua azienda: {selectedStudent.matchScore ?? 0}%
                  </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6 overflow-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.sectorIds?.map(s => (
                        <Badge key={s} className="bg-white text-primary border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <div className={`text-3xl font-bold font-headline ${(selectedStudent.matchScore || 0) >= 80 ? 'text-green-600' : 'text-primary'}`}>
                      {selectedStudent.matchScore ?? 0}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Esperienze e Competenze</h4>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedStudent.cvInformation}</p>
                  </div>
                  {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skills estratte dall'AI</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedStudent.pdfPath && (
                      <Button variant="outline" className="rounded-xl gap-2" asChild>
                        <a href={`/api/cv/${selectedStudent.id}/pdf`} target="_blank" rel="noopener">
                          <Download className="w-4 h-4" /> PDF Originale
                        </a>
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl h-11"
                      disabled={startingChat === selectedStudent.id}
                      onClick={() => onChat(inst.id, selectedStudent.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Contatta Istituto su questo studente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
