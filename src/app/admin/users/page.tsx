"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Search,
  MapPin,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApiData, apiFetch, useMe } from "@/lib/api";
import { isAdminRole } from "@/types";
import type { UserProfile, CompanyProfile, InstituteProfile } from "@/types";

type UserWithProfile = UserProfile & { profile: (CompanyProfile | InstituteProfile) | null };

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user: me } = useMe();
  const isSuperAdmin = me?.role === "SuperAdmin";

  const { data: users, isLoading, refetch } = useApiData<UserWithProfile[]>("/api/admin/users", 30_000);

  const companies = (users || []).filter(u => u.role === "Company");
  const institutes = (users || []).filter(u => u.role === "Institute");
  const admins = (users || []).filter(u => isAdminRole(u.role));

  const handleUpdateStatus = async (userId: string, status: 'Approved' | 'Rejected') => {
    setUpdatingId(userId);
    const res = await apiFetch(`/api/admin/users/${userId}`, { method: "PATCH", json: { status } });
    setUpdatingId(null);
    if (res.ok) {
      toast({
        title: status === 'Approved' ? "Utente Approvato" : "Utente Rifiutato",
        description: "Lo stato dell'utente è stato aggiornato. Email inviata.",
      });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiornare lo stato dell'utente." });
    }
  };

  const handleUpdateRole = async (userId: string, role: 'Admin' | 'revoke') => {
    setUpdatingId(userId);
    const res = await apiFetch(`/api/admin/users/${userId}`, { method: "PATCH", json: { role } });
    setUpdatingId(null);
    if (res.ok) {
      toast({
        title: role === 'Admin' ? "Admin assegnato" : "Ruolo Admin revocato",
        description: role === 'Admin' ? "L'utente ora ha accesso all'area amministrativa." : "L'utente è tornato al suo ruolo precedente.",
      });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: (res.data as { error?: string }).error || "Impossibile aggiornare il ruolo." });
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.profile as CompanyProfile | null)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredInstitutes = institutes.filter(i =>
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.profile as InstituteProfile | null)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    {companies.filter(c => c.status === 'Pending').length > 0 && (
                      <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {companies.filter(c => c.status === 'Pending').length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="institutes" className="rounded-lg gap-2">
                    <Users className="w-4 h-4" /> Istituti
                    {institutes.filter(i => i.status === 'Pending').length > 0 && (
                      <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {institutes.filter(i => i.status === 'Pending').length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="admins" className="rounded-lg gap-2">
                    <ShieldCheck className="w-4 h-4" /> Amministratori
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
                        {filteredCompanies.length ? filteredCompanies.map((company) => {
                          const p = company.profile as CompanyProfile | null;
                          return (
                            <TableRow key={company.id}>
                              <TableCell className="font-bold text-slate-700">
                                <div className="flex flex-col">
                                  {p?.name || company.name}
                                  <span className="text-[10px] text-slate-400 font-normal">P.IVA: {p?.vatNumber || "—"} · {company.email}</span>
                                </div>
                              </TableCell>
                              <TableCell><StatusBadge status={company.status} /></TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {p?.address || "—"}
                                  </div>
                                  <div className="text-xs text-primary flex items-center gap-1 font-medium">
                                    <ExternalLink className="w-3 h-3" /> {p?.website || "—"}
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
                                      onClick={() => handleUpdateStatus(company.id, 'Approved')}
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
                                      onClick={() => handleUpdateStatus(company.id, 'Rejected')}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Rifiuta
                                    </Button>
                                  )}
                                  {isSuperAdmin && company.status === 'Approved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-primary border-primary/20 hover:bg-blue-50 rounded-lg h-8"
                                      disabled={updatingId === company.id}
                                      onClick={() => handleUpdateRole(company.id, 'Admin')}
                                    >
                                      <ShieldCheck className="w-4 h-4 mr-1" />
                                      Rendi Admin
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
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
                        {filteredInstitutes.length ? filteredInstitutes.map((inst) => {
                          const p = inst.profile as InstituteProfile | null;
                          return (
                            <TableRow key={inst.id}>
                              <TableCell className="font-bold text-slate-700">
                                <div className="flex flex-col">
                                  {p?.name || inst.name}
                                  <span className="text-[10px] text-slate-400 font-normal">{inst.email}</span>
                                </div>
                              </TableCell>
                              <TableCell><StatusBadge status={inst.status} /></TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase">{p?.types?.join(", ") || "—"}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {inst.status !== 'Approved' && (
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8"
                                      disabled={updatingId === inst.id}
                                      onClick={() => handleUpdateStatus(inst.id, 'Approved')}
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
                                      onClick={() => handleUpdateStatus(inst.id, 'Rejected')}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Rifiuta
                                    </Button>
                                  )}
                                  {isSuperAdmin && inst.status === 'Approved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-primary border-primary/20 hover:bg-blue-50 rounded-lg h-8"
                                      disabled={updatingId === inst.id}
                                      onClick={() => handleUpdateRole(inst.id, 'Admin')}
                                    >
                                      <ShieldCheck className="w-4 h-4 mr-1" />
                                      Rendi Admin
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-400">Nessun istituto trovato.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="admins" className="mt-0">
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Amministratore</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.length ? admins.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-bold text-slate-700">
                              <div className="flex flex-col">
                                {a.name}
                                <span className="text-[10px] text-slate-400 font-normal">{a.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {a.role === 'SuperAdmin' ? (
                                <Badge className="bg-purple-100 text-purple-700 border-none gap-1 font-bold h-6"><ShieldCheck className="w-3 h-3" /> Super Admin</Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 border-none gap-1 font-bold h-6"><ShieldCheck className="w-3 h-3" /> Admin</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isSuperAdmin && a.role === 'Admin' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/20 hover:bg-red-50 rounded-lg h-8"
                                  disabled={updatingId === a.id}
                                  onClick={() => handleUpdateRole(a.id, 'revoke')}
                                >
                                  {updatingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                                  Revoca Admin
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-slate-400">Nessun amministratore.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {!isSuperAdmin && (
                    <p className="text-xs text-slate-400 mt-3">Solo il Super Admin può nominare o revocare gli amministratori (reti aziende/scuole).</p>
                  )}
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
