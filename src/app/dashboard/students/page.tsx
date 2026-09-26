
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, User, X, Loader2, Trash2, Sparkles, Upload, Download } from "lucide-react";
import { useState, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuthGuard, useApiData, apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { StudentCV } from "@/types";

interface Named { id: string; name: string }

export default function StudentsPage() {
  const { user } = useAuthGuard("Institute");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfToSaveRef = useRef<File | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", class: "", cvInformation: "" });
  const [newSectors, setNewSectors] = useState<string[]>([]);
  const [newSkills, setNewSkills] = useState<string[]>([]);

  const { data: students, isLoading, refetch } = useApiData<StudentCV[]>(user ? "/api/students" : null);
  const { data: availableSectors } = useApiData<Named[]>("/api/sectors");

  const filteredStudents = students?.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentClass || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSector = (sector: string) => {
    if (!newSectors.includes(sector)) setNewSectors([...newSectors, sector]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Formato non supportato", description: "Carica solo file in formato PDF." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File troppo grande", description: "Il PDF non può superare i 10MB." });
      return;
    }

    // Conserva il PDF per il salvataggio finale (Fase: PDF deve essere salvato)
    pdfToSaveRef.current = file;

    setIsParsing(true);
    setParsingStatus("L'AI sta analizzando il CV...");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/students/parse", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "parse failed");

      setNewStudent({
        name: data.name || "",
        class: data.studentClass || "",
        cvInformation: data.summary || "",
      });
      setNewSectors(data.suggestedSectorIds || []);
      setNewSkills(data.skills || []);
      toast({ title: "Analisi IA Completata", description: "Dati estratti. Verifica e salva il profilo." });
    } catch (err) {
      const msg = (err as Error).message;
      toast({
        variant: "destructive",
        title: "Analisi IA non riuscita",
        description: msg.includes("503")
          ? "Il servizio AI non e' disponibile. Compila i campi manualmente — il PDF verra' comunque salvato."
          : "Impossibile analizzare il PDF. Compila i campi manualmente.",
      });
    } finally {
      setIsParsing(false);
      setParsingStatus("");
      e.target.value = "";
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newSectors.length === 0) {
      toast({ variant: "destructive", title: "Settori mancanti", description: "Seleziona almeno un settore per permettere il matching." });
      return;
    }

    setIsAdding(true);
    try {
      const fd = new FormData();
      fd.append("name", newStudent.name);
      fd.append("studentClass", newStudent.class);
      fd.append("cvInformation", newStudent.cvInformation);
      fd.append("sectorIds", JSON.stringify(newSectors));
      fd.append("skills", JSON.stringify(newSkills));
      if (pdfToSaveRef.current) fd.append("pdf", pdfToSaveRef.current);

      const res = await fetch("/api/students", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "save failed");

      toast({ title: "Profilo Salvato", description: "Studente aggiunto e PDF archiviato sul server." });
      setNewStudent({ name: "", class: "", cvInformation: "" });
      setNewSectors([]);
      setNewSkills([]);
      pdfToSaveRef.current = null;
      setDialogOpen(false);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Errore Salvataggio", description: "Impossibile salvare il profilo dello studente." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Profilo eliminato", description: "Record e PDF rimossi definitivamente." });
      refetch();
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare il profilo." });
    }
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
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Database Studenti (CV)</h1>
              <p className="text-slate-500">Gestisci i profili dei tuoi studenti e attiva il matching intelligente.</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl gap-2 h-12 px-6 shadow-lg shadow-orange-100">
                  <Plus className="w-5 h-5" /> Aggiungi Studente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[750px] rounded-[32px] max-h-[90vh] overflow-y-auto border-none p-0">
                <DialogHeader className="p-8 bg-primary text-white">
                  <DialogTitle className="text-2xl font-headline text-white">Nuovo Profilo Studente</DialogTitle>
                  <DialogDescription className="text-blue-100">
                    Carica un PDF Europass: il file viene salvato sul server e analizzato dall'AI.
                  </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                  <div className="p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-primary/20 relative overflow-hidden">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <Sparkles className={`w-10 h-10 text-secondary ${isParsing ? 'animate-bounce' : 'animate-pulse'}`} />
                      </div>
                      <div className="flex-1 text-center md:text-left space-y-1">
                        <h3 className="font-bold text-primary text-lg">Caricamento Intelligente</h3>
                        <p className="text-sm text-slate-500">
                          {isParsing ? parsingStatus : pdfToSaveRef.current ? `PDF pronto: ${pdfToSaveRef.current.name}` : "Seleziona un PDF Europass per pre-compilare i dati automaticamente."}
                        </p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 font-bold min-w-[160px]"
                      >
                        {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
                        {isParsing ? "Analisi..." : "Seleziona PDF"}
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleAddStudent} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold">Nome e Cognome</Label>
                        <Input
                          placeholder="Es: Mario Rossi"
                          required
                          className="rounded-xl h-12"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Classe / Indirizzo</Label>
                        <Input
                          placeholder="Es: 5C Meccatronica"
                          required
                          className="rounded-xl h-12"
                          value={newStudent.class}
                          onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex justify-between font-bold">
                        <span>Settori per il Matching</span>
                        <span className="text-[10px] text-slate-400 font-normal uppercase">L'IA ha suggerito questi tag</span>
                      </Label>
                      <div className="flex flex-wrap gap-2 mb-3 p-4 bg-slate-50 rounded-2xl min-h-[60px] border border-slate-100">
                        {newSectors.map(s => (
                          <Badge key={s} className="bg-primary text-white gap-2 py-2 px-4 rounded-xl text-xs font-bold border-none">
                            {s}
                            <X className="w-3.5 h-3.5 cursor-pointer hover:text-secondary" onClick={() => setNewSectors(newSectors.filter(x => x !== s))} />
                          </Badge>
                        ))}
                        {newSectors.length === 0 && <span className="text-sm text-slate-400 italic py-1">Nessun settore selezionato.</span>}
                      </div>
                      <Select onValueChange={handleAddSector}>
                        <SelectTrigger className="rounded-xl h-12 border-slate-200">
                          <SelectValue placeholder="Aggiungi settori manualmente..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {availableSectors?.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Sommario Esperienze e Competenze</Label>
                      <textarea
                        className="w-full min-h-[120px] rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/30"
                        placeholder="Il riassunto professionale apparirà qui..."
                        value={newStudent.cvInformation}
                        onChange={(e) => setNewStudent({...newStudent, cvInformation: e.target.value})}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isAdding || isParsing}
                      className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold h-14 rounded-2xl text-lg shadow-xl shadow-orange-100"
                    >
                      {isAdding ? <Loader2 className="w-6 h-6 animate-spin" /> : "Conferma e Salva Profilo"}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[32px]">
            <div className="p-8 bg-white border-b flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50 focus:bg-white shadow-inner"
                  placeholder="Cerca per nome studente o indirizzo di studio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="secondary" className="h-10 px-4 bg-blue-50 text-primary border-none rounded-xl font-bold">
                {filteredStudents?.length || 0} Studenti Totali
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold py-6 px-8">Nome Studente</TableHead>
                    <TableHead className="font-bold">Indirizzo / Classe</TableHead>
                    <TableHead className="font-bold">Settori per Matching</TableHead>
                    <TableHead className="font-bold">CV</TableHead>
                    <TableHead className="text-right font-bold px-8">Gestione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.length ? filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-blue-50/30 border-slate-50">
                      <TableCell className="font-bold text-slate-700 py-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs shadow-inner">
                            {(student.name || "?").substring(0, 2).toUpperCase()}
                          </div>
                          {student.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-secondary" />
                          {student.studentClass}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {student.sectorIds?.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] bg-white text-primary border border-blue-100 font-bold uppercase py-1 shadow-sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.pdfPath ? (
                          <a href={`/api/cv/${student.id}/pdf`} target="_blank" rel="noopener">
                            <Button variant="ghost" size="icon" className="text-primary hover:bg-blue-50 rounded-xl" title="Scarica PDF originale">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-destructive hover:bg-red-50 rounded-xl">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare questo studente?</AlertDialogTitle>
                              <AlertDialogDescription>Il profilo di <strong>{student.name}</strong> e il suo PDF verranno rimossi definitivamente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(student.id)}>Elimina</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <User className="w-20 h-20" />
                          <div className="space-y-1">
                            <p className="font-bold text-xl">Database Vuoto</p>
                            <p className="text-sm">Inizia caricando un CV Europass per attivare il matching.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
