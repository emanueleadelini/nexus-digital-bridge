"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, Plus, Trash2, Calendar, User, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

export default function AdminBlogPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const blogRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "blogPosts");
  }, [db, user]);

  const { data: posts, isLoading } = useCollection(blogRef);

  const [isAdding, setIsAdding] = useState(false);
  const generateImageUrl = () => `https://picsum.photos/seed/${Math.random()}/800/600`;

  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    content: "",
    imageUrl: generateImageUrl(),
    author: "Admin Nexus",
    tags: ""
  });

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogRef) return;

    setIsAdding(true);
    try {
      await addDoc(blogRef, {
        ...newPost,
        tags: newPost.tags.split(",").map(t => t.trim()),
        publishedAt: serverTimestamp(),
      });
      toast({ title: "Articolo pubblicato", description: "Il nuovo post è ora visibile sul blog." });
      setNewPost({ title: "", excerpt: "", content: "", imageUrl: generateImageUrl(), author: "Admin Nexus", tags: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile pubblicare l'articolo." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "blogPosts", id));
      toast({ title: "Articolo rimosso", description: "L'articolo è stato eliminato con successo." });
    } catch (error) {
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
                    <input 
                      placeholder="Il futuro del PCTO nel 2026..." 
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      required 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-xl" 
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
                      <Label>URL Immagine</Label>
                      <Input 
                        value={newPost.imageUrl}
                        onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash.com/..." 
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
                      <TableCell className="font-bold text-slate-700 max-w-xs truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-4 h-4" />
                          {post.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {post.publishedAt ? format(post.publishedAt.toDate(), "d MMM yyyy", { locale: it }) : "Bozza"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/blog/${post.id}`}>
                            <Eye className="w-4 h-4 text-primary" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
