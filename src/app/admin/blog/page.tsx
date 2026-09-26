"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, Plus, Trash2, Calendar, User, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { useApiData, apiFetch } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BlogPost {
  id: string;
  title: string;
  author: string;
  publishedAt?: string;
}

export default function AdminBlogPage() {
  const { toast } = useToast();
  const { data: posts, isLoading, refetch } = useApiData<BlogPost[]>("/api/admin/blog");
  const [isAdding, setIsAdding] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", excerpt: "", content: "", coverImage: "", tags: "" });

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const res = await apiFetch("/api/admin/blog", {
      json: {
        title: newPost.title,
        excerpt: newPost.excerpt,
        content: newPost.content,
        coverImage: newPost.coverImage || null,
        tags: newPost.tags.split(",").map(t => t.trim()).filter(Boolean),
      },
    });
    setIsAdding(false);
    if (res.ok) {
      toast({ title: "Articolo pubblicato", description: "Il nuovo post è ora visibile sul blog." });
      setNewPost({ title: "", excerpt: "", content: "", coverImage: "", tags: "" });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile pubblicare l'articolo." });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Articolo rimosso" });
      refetch(true);
    } else {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare l'articolo." });
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
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Gestione Blog</h1>
              <p className="text-slate-500">Scrivi e pubblica articoli per la community Nexus.</p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl gap-2 h-12 px-6">
                  <Plus className="w-5 h-5" />
                  Nuovo Articolo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline">Crea Nuovo Post</DialogTitle>
                  <DialogDescription>Inserisci i dettagli del post per informare la tua rete di utenti.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPost} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label>Titolo Articolo</Label>
                    <Input
                      placeholder="Il futuro del PCTO nel 2026..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Breve Estratto (Preview)</Label>
                    <Textarea
                      placeholder="Una breve introduzione che apparirà nella card..."
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                      required
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenuto Completo</Label>
                    <Textarea
                      placeholder="Scrivi qui il testo completo dell'articolo..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      required
                      className="rounded-xl min-h-[250px]"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL Immagine (opzionale)</Label>
                      <Input
                        value={newPost.coverImage}
                        onChange={(e) => setNewPost({...newPost, coverImage: e.target.value})}
                        placeholder="https://..."
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tag (separati da virgola)</Label>
                      <Input
                        value={newPost.tags}
                        onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                        placeholder="PCTO, Aziende, Futuro"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isAdding} className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold h-12 rounded-xl">
                    {isAdding ? <Loader2 className="w-6 h-6 animate-spin" /> : "Pubblica Articolo"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Titolo Articolo</TableHead>
                  <TableHead>Autore</TableHead>
                  <TableHead>Data Pubblicazione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-bold text-slate-700 max-w-xs truncate">{post.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-4 h-4" />
                          {post.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {post.publishedAt ? format(new Date(post.publishedAt), "d MMM yyyy", { locale: it }) : "Bozza"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/blog/${post.id}`}>
                              <Eye className="w-4 h-4 text-primary" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminare questo articolo?</AlertDialogTitle>
                                <AlertDialogDescription>L'articolo "{post.title}" verrà eliminato definitivamente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(post.id)}>Elimina</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                      Nessun articolo pubblicato. Inizia ora!
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
