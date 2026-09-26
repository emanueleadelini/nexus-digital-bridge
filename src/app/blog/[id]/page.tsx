"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  content?: string;
  author: string;
  publishedAt?: string;
  coverImage?: string | null;
  tags?: string[];
}

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const { data: post, isLoading } = useApiData<BlogPost>(`/api/blog/${id}`, 60_000);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiato", description: "Il link all'articolo è negli appunti." });
    } catch {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile copiare il link." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-700">Articolo non trovato</h1>
            <Button asChild variant="outline">
              <Link href="/blog">Torna al Blog</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Torna al Blog
          </Link>

          <article className="bg-white rounded-3xl overflow-hidden shadow-xl">
            {post.coverImage && (
              <div className="relative h-[400px]">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {post.publishedAt ? format(new Date(post.publishedAt), "d MMMM yyyy", { locale: it }) : "—"}
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" /> {post.author}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={handleShare}>
                  <Share2 className="w-3 h-3" /> Condividi
                </Button>
              </div>

              <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-8 leading-tight">
                {post.title}
              </h1>

              <div className="prose prose-slate max-w-none prose-lg text-slate-600 whitespace-pre-wrap">
                {post.content}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
