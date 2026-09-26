"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowRight, Newspaper, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useApiData } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  author: string;
  publishedAt?: string;
  coverImage?: string | null;
}

export default function BlogPage() {
  const { data: posts, isLoading } = useApiData<BlogPost[]>("/api/blog", 60_000);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary p-2 rounded-xl">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-primary">Blog & News</h1>
          </div>
          <p className="text-slate-500 mb-12 max-w-2xl">
            Approfondimenti, aggiornamenti della piattaforma e storie di successo dal mondo Nexus Digital Bridge.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="border-none shadow-lg overflow-hidden flex flex-col hover:-translate-y-1 transition-transform">
                  <div className="relative h-48">
                    <Image
                      src={post.coverImage || "https://picsum.photos/seed/blog/600/400"}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt ? format(new Date(post.publishedAt), "d MMM yyyy", { locale: it }) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {post.author}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2">{post.title}</h2>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">{post.excerpt}</p>
                    <Link href={`/blog/${post.id}`} className="text-primary font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                      Leggi l'articolo <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-600">Nessun articolo pubblicato</h2>
              <p className="text-slate-400">Torna presto per nuovi contenuti!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
