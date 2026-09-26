"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useApiData, apiFetch } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Named { id: string; name: string }

export default function AdminSectorsPage() {
  const { toast } = useToast();
  const [newSector, setNewSector] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: sectors, isLoading, refetch } = useApiData<Named[]>("/api/admin/sectors");

  const handleAdd = async () => {
    const trimmed = newSector.trim();
    if (!trimmed) return;
    setIsAdding(true);
    const res = await apiFetch("/api/admin/sectors", { json: { name: trimmed } });
    setIsAdding(false);
    if (res.ok) {
      setNewSector("");
      toast({ title: "Settore aggiunto", description: `${trimmed} è ora disponibile nel sistema.` });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: (res.data as { error?: string }).error || "Impossibile aggiungere il settore." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await apiFetch(`/api/admin/sectors/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Settore rimosso", description: "Il settore è stato eliminato." });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare il settore." });
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
              <h1 className="text-3xl font-headline font-bold text-primary">Settori Merceologici</h1>
              <p className="text-slate-500">Gestisci i settori Confindustria utilizzati per il matching.</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-2xl">
              <Database className="w-8 h-8" />
            </div>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Aggiungi Nuovo Settore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  placeholder="Esempio: Aerospaziale, Biomedicale..."
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={isAdding} className="bg-secondary hover:bg-secondary/90 text-white rounded-xl gap-2 font-bold px-6">
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
                  <TableHead>Nome Settore</TableHead>
                  <TableHead className="w-[100px] text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors && sectors.length > 0 ? (
                  sectors.map((sector) => (
                    <TableRow key={sector.id} className="hover:bg-blue-50/50">
                      <TableCell className="font-medium text-slate-700">{sector.name}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare il settore?</AlertDialogTitle>
                              <AlertDialogDescription>"{sector.name}" verrà rimosso. I profili che lo usano non saranno aggiornati automaticamente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(sector.id, sector.name)}>Elimina</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-12 text-slate-400">
                      Nessun settore configurato.
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
