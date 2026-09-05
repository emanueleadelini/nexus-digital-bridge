"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Search, 
  Mail, 
  MapPin, 
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sendApprovalEmail, sendRejectionEmail } from "@/app/actions/notifications";

export default function AdminUsersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const companiesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "companies");
  }, [db, user]);
  
  const institutesRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "institutes");
  }, [db, user]);

  const { data: companies, isLoading: loadingCompanies } = useCollection(companiesRef);
  const { data: institutes, isLoading: loadingInstitutes } = useCollection(institutesRef);

  const handleUpdateStatus = async (userId: string, role: string, status: 'Approved' | 'Rejected') => {
    if (!db) return;
    setUpdatingId(userId);
    try {
      const collectionPath = role === 'Company' ? 'companies' : 'institutes';
      
      // Aggiorna documento nel profilo specifico
      await updateDoc(doc(db, collectionPath, userId), { status });
      
      // Aggiorna documento utente principale
      await updateDoc(doc(db, "users", userId), { status });

      // Recupera dati utente per l'invio dell'email
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      // Invia email di notifica appropriata (solo admin autenticato)
      if (userData?.email && user) {
        const userName = userData.firstName || 'Utente';
        const idToken = await user.getIdToken();
        if (status === 'Approved') {
          sendApprovalEmail(userData.email, userName, idToken).catch(() => {});
        } else if (status === 'Rejected') {
          sendRejectionEmail(userData.email, userName, idToken).catch(() => {});
        }
      }

      toast({
        title: status === 'Approved' ? "Utente Approvato" : "Utente Rifiutato",
        description: `Lo stato dell'utente è stato aggiornato con successo.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare lo stato dell'utente.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCompanies = companies?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstitutes = institutes?.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Gestione Utenti</h1>
              <p className="text-slate-500">Verifica e approva i nuovi account registrati sulla piattaforma.</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-2xl">
              <Users className="w-8 h-8" />
            </div>
          </div>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="pb-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Cerca per nome..." 
                  className="pl-10 rounded-xl" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="companies" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="companies" className="rounded-lg gap-2">
                    <Building2 className="w-4 h-4" /> Aziende
                    {companies?.filter(c => c.status === 'Pending').length ? (
                      <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {companies.filter(c => c.status === 'Pending').length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="institutes" className="rounded-lg gap-2">
                    <Users className="w-4 h-4" /> Istituti
                    {institutes?.filter(i => i.status === 'Pending').length ? (
                      <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {institutes.filter(i => i.status === 'Pending').length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="companies" className="mt-0">
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Azienda</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Contatti</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCompanies?.length ? filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-bold text-slate-700">
                              <div className="flex flex-col">
                                {company.name}
                                <span className="text-[10px] text-slate-400 font-normal">P.IVA: {company.vatNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                               <StatusBadge status={company.status} />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {company.address}
                                </div>
                                <div className="text-xs text-primary flex items-center gap-1 font-medium">
                                  <ExternalLink className="w-3 h-3" /> {company.website}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {company.status !== 'Approved' && (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8"
                                    disabled={updatingId === company.id}
                                    onClick={() => handleUpdateStatus(company.id, 'Company', 'Approved')}
                                  >
                                    {updatingId === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                    Approva
                                  </Button>
                                )}
                                {company.status === 'Pending' && (
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    className="text-destructive border-destructive/20 hover:bg-red-50 rounded-lg h-8"
                                    disabled={updatingId === company.id}
                                    onClick={() => handleUpdateStatus(company.id, 'Company', 'Rejected')}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rifiuta
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-400">Nessuna azienda trovata.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="institutes" className="mt-0">
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Istituto</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Tipologia</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInstitutes?.length ? filteredInstitutes.map((inst) => (
                          <TableRow key={inst.id}>
                            <TableCell className="font-bold text-slate-700">{inst.name}</TableCell>
                            <TableCell>
                               <StatusBadge status={inst.status} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase">{inst.types?.join(", ")}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {inst.status !== 'Approved' && (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8"
                                    disabled={updatingId === inst.id}
                                    onClick={() => handleUpdateStatus(inst.id, 'Institute', 'Approved')}
                                  >
                                    {updatingId === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                    Approva
                                  </Button>
                                )}
                                {inst.status === 'Pending' && (
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    className="text-destructive border-destructive/20 hover:bg-red-50 rounded-lg h-8"
                                    disabled={updatingId === inst.id}
                                    onClick={() => handleUpdateStatus(inst.id, 'Institute', 'Rejected')}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rifiuta
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-400">Nessun istituto trovato.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'Approved':
      return <Badge className="bg-green-100 text-green-700 border-none gap-1 font-bold h-6"><CheckCircle className="w-3 h-3" /> Approvato</Badge>;
    case 'Rejected':
      return <Badge className="bg-red-100 text-red-700 border-none gap-1 font-bold h-6"><XCircle className="w-3 h-3" /> Rifiutato</Badge>;
    default:
      return <Badge className="bg-orange-100 text-orange-700 border-none gap-1 font-bold h-6"><Clock className="w-3 h-3" /> In Attesa</Badge>;
  }
}
