"use client";

import { use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, User, ArrowLeft, Clock, Share2, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  
  const postRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "blogPosts", id);
  }, [db, id]);

  const { data: post, isLoading } = useDoc(postRef);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20 animate-pulse space-y-8">
          <div className="h-10 bg-slate-200 w-2/3 rounded-xl mx-auto" />
          <div className="h-[400px] bg-slate-200 w-full rounded-3xl" />
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-bold text-primary mb-4">Articolo non trovato</h1>
          <Button asChild>
            <Link href="/">Torna alla Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <article className="pb-20">
        {/* Header Articolo */}
        <header className="bg-primary pt-12 pb-32 text-white relative">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Torna alla Home
            </Link>
            <h1 className="text-4xl md:text-6xl font-headline font-bold leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-secondary" />
                {post.publishedAt ? format(post.publishedAt.toDate(), "d MMMM yyyy", { locale: it }) : "In Revisione"}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary" />
                Scritto da: {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                5 min di lettura
              </div>
            </div>
          </div>
        </header>

        {/* Immagine Hero e Contenuto */}
        <div className="container mx-auto px-4 max-w-4xl -mt-20 relative z-10">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <Image 
              src={post.imageUrl || "https://picsum.photos/seed/blog-nexus/1200/800"} 
              alt={post.title} 
              fill 
              className="object-cover"
            />
          </div>

          <div className="bg-white mt-12 p-8 md:p-12 rounded-3xl shadow-xl space-y-8">
            <div className="prose prose-slate lg:prose-xl max-w-none">
              <p className="text-xl text-slate-600 font-medium italic border-l-4 border-secondary pl-6 mb-8">
                {post.excerpt}
              </p>
              
              <div className="whitespace-pre-line text-slate-700 leading-relaxed text-lg">
                {post.content}
              </div>
            </div>

            <div className="pt-8 border-t flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Footer semplificato */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="font-headline font-bold text-2xl">Nexus Digital Bridge</span>
          </div>
          <div className="flex justify-center gap-6 mb-4 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Termini di Servizio</Link>
          </div>
          <p className="text-slate-500 text-sm italic">© 2026 Nexus Digital Bridge - "Colleghiamo oggi il talento di domani."</p>
        </div>
      </footer>
    </div>
  );
}