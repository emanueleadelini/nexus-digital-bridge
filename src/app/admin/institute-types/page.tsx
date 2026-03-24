"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ListTree, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminInstituteTypesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [newType, setNewType] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const typesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "instituteTypes");
  }, [db, user]);

  const { data: types, isLoading } = useCollection(typesRef);

  const handleAdd = async () => {
    const trimmed = newType.trim();
    if (!trimmed || !typesRef) return;
    if (types?.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ variant: "destructive", title: "Duplicato", description: `"${trimmed}" esiste già.` });
      return;
    }
    setIsAdding(true);
    try {
      await addDoc(typesRef, { name: trimmed });
      setNewType("");
      toast({ title: "Tipologia aggiunta", description: `${trimmed} è ora disponibile nel sistema.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiungere la tipologia." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "instituteTypes", id));
      toast({ title: "Tipologia rimossa", description: "La tipologia è stata eliminata correttamente." });
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare la tipologia." });
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
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Tipologie Istituti</h1>
              <p className="text-slate-500">Gestisci le tipologie di scuola (Licei, Tecnici, ecc.) disponibili per gli utenti.</p>
            </div>
            <div className="bg-secondary text-white p-3 rounded-2xl">
              <ListTree className="w-8 h-8" />
            </div>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Aggiungi Nuova Tipologia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Esempio: Liceo Scientifico, Istituto Tecnico..." 
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={isAdding} className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold px-6">
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Aggiungi
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nome Tipologia</TableHead>
                  <TableHead className="w-[100px] text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types && types.length > 0 ? (
                  types.map((type) => (
                    <TableRow key={type.id} className="hover:bg-blue-50/50">
                      <TableCell className="font-medium text-slate-700">{type.name}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare la tipologia?</AlertDialogTitle>
                              <AlertDialogDescription>"{type.name}" verrà rimossa. Gli istituti che la usano non saranno aggiornati automaticamente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(type.id)}>Elimina</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-12 text-slate-400">
                      Nessuna tipologia configurata.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}
