
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, ArrowRight, Newspaper, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicBlogPage() {
  const db = useFirestore();
  
  const blogRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "blogPosts"), orderBy("publishedAt", "desc"));
  }, [db]);

  const { data: posts, isLoading } = useCollection(blogRef);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pb-20">
        {/* Header */}
        <header className="bg-primary pt-20 pb-32 text-white">
          <div className="container mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full font-bold text-sm mb-4">
              <Newspaper className="w-4 h-4" />
              <span>Nexus Magazine</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-bold">News & Approfondimenti</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Resta aggiornato sulle ultime tendenze del PCTO, storie di successo e innovazioni nel matching scuola-lavoro.
            </p>
          </div>
        </header>

        <div className="container mx-auto px-4 -mt-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse h-[400px] rounded-3xl" />
              ))
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <Card className="border-none shadow-xl overflow-hidden h-full hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl">
                    <div className="relative h-56 overflow-hidden">
                      <Image 
                        src={post.imageUrl || "https://picsum.photos/seed/blog/800/600"} 
                        alt={post.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase shadow-sm">
                          {post.tags?.[0] || 'News'}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt ? format(post.publishedAt.toDate(), "d MMM yyyy", { locale: it }) : "Bozza"}
                      </div>
                      <h3 className="text-2xl font-bold font-headline group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="pt-4 flex items-center gap-2 text-primary font-bold text-sm">
                        Leggi di più <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl shadow-xl">
                <p className="text-slate-400">Nessun articolo disponibile al momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="font-headline font-bold text-2xl">Nexus Digital Bridge</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Nexus Digital Bridge. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
