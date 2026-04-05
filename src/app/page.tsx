
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, GraduationCap, Handshake, Zap, Calendar, ArrowRight, Lock, UserPlus, Settings2, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit, where } from "firebase/firestore";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const db = useFirestore();
  
  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "config", "landingPage");
  }, [db]);

  const blogRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "blogPosts"), orderBy("publishedAt", "desc"), limit(3));
  }, [db]);

  const companiesRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "companies"), where("isDemo", "!=", true));
  }, [db]);

  const institutesRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "institutes"), where("isDemo", "!=", true));
  }, [db]);

  const { data: config } = useDoc(configRef);
  const { data: posts } = useCollection(blogRef);
  const { data: companies } = useCollection(companiesRef);
  const { data: institutes } = useCollection(institutesRef);

  const heroPlaceholder = PlaceHolderImages.find(img => img.id === 'hero-bg');

  // Fallback Values
  const content = {
    heroTitle: config?.heroTitle || "Il Ponte Digitale tra Talento e Opportunità",
    heroSubtitle: config?.heroSubtitle || "Colleghiamo Istituti Scolastici e Aziende attraverso un sistema di matching intelligente basato sui settori merceologici reali.",
    heroImageUrl: config?.heroImageUrl || heroPlaceholder?.imageUrl || "https://picsum.photos/seed/nexus1/800/800",
    featuresTitle: config?.featuresTitle || "Un'ecosistema costruito per il valore",
    featuresSubtitle: config?.featuresSubtitle || "Abbiamo creato strumenti specifici per ogni attore del sistema scolastico-produttivo.",
    f1Title: config?.feature1Title || "Per le Aziende",
    f1Desc: config?.feature1Desc || "Accedi a un database di profili studenti filtrati per settori merceologici affini alla tua attività. Inizia conversazioni dirette con gli istituti.",
    f2Title: config?.feature2Title || "Per gli Istituti",
    f2Desc: config?.feature2Desc || "Valorizza il percorso dei tuoi studenti caricando i loro CV. Ricevi notifiche quando un'azienda mostra interesse per i tuoi profili.",
    f3Title: config?.feature3Title || "Matching Intelligente",
    f3Desc: config?.feature3Desc || "Il nostro algoritmo analizza i settori merceologici Confindustria per suggerire le connessioni più promettenti tra domanda e offerta.",
    s1Label: config?.stat1Label || "Aziende Iscritte",
    s1Value: config?.stat1Value || "450+",
    s2Label: config?.stat2Label || "Istituti Partner",
    s2Value: config?.stat2Value || "120+",
    s3Label: config?.stat3Label || "CV Studenti",
    s3Value: config?.stat3Value || "8,500+",
    s4Label: config?.stat4Label || "Conversazioni",
    s4Value: config?.stat4Value || "15k",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8">
              <h1 className="text-5xl lg:text-7xl font-headline font-bold leading-tight">
                {content.heroTitle}
              </h1>
              <p className="text-xl text-blue-100 max-w-lg leading-relaxed">
                {content.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-secondary/20" asChild>
                  <Link href="/register">Inizia Ora</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-white/10">
                <Image 
                  src={content.heroImageUrl} 
                  alt="Nexus Hero Connection" 
                  fill 
                  className="object-cover"
                  data-ai-hint={heroPlaceholder?.imageHint || "education business"}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-500 uppercase">Match Attivi</div>
                  <div className="text-2xl font-bold text-primary font-headline">+1,240</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Come Funziona Section */}
      <section id="come-funziona" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-headline font-bold text-primary">Come Funziona</h2>
            <p className="text-slate-500 text-lg">
              Tre passi semplici per connettere talento e opportunità in modo intelligente.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-slate-100 z-0" />
            <HowItWorksStep
              number={1}
              icon={<UserPlus className="w-6 h-6" />}
              title="Registrati"
              description="Crea il tuo account come Azienda o Istituto. Il team Nexus verifica il tuo profilo entro 24 ore."
            />
            <HowItWorksStep
              number={2}
              icon={<Settings2 className="w-6 h-6" />}
              title="Configura il Profilo"
              description="Indica i settori merceologici Confindustria di interesse. Gli istituti caricano i CV Europass degli studenti con parsing AI."
            />
            <HowItWorksStep
              number={3}
              icon={<Zap className="w-6 h-6" />}
              title="Connettiti"
              description="L'algoritmo Nexus 3.0 calcola la compatibilità e ti suggerisce i match migliori. Inizia subito una conversazione diretta."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-headline font-bold text-primary">{content.featuresTitle}</h2>
            <p className="text-slate-500 text-lg">
              {content.featuresSubtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Briefcase className="w-8 h-8" />}
              title={content.f1Title}
              description={content.f1Desc}
            />
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8" />}
              title={content.f2Title}
              description={content.f2Desc}
            />
            <FeatureCard 
              icon={<Handshake className="w-8 h-8" />}
              title={content.f3Title}
              description={content.f3Desc}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem label="Aziende Registrate" value={companies ? `${companies.length}+` : (content.s1Value)} />
            <StatItem label="Istituti Partner" value={institutes ? `${institutes.length}+` : (content.s2Value)} />
            <StatItem label="Settori Confindustria" value="13" />
            <StatItem label={content.s4Label} value={config?.stat4Value || "100+"} />
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      {posts && posts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold text-primary">Ultime dal Blog</h2>
                <p className="text-slate-500">Notizie, approfondimenti e storie di successo dalla nostra community.</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold hidden md:flex items-center gap-2" asChild>
                <Link href="/blog">Vedi tutto <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <Card className="border-none shadow-lg overflow-hidden h-full hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <Image 
                        src={post.imageUrl || "https://picsum.photos/seed/blog/800/600"} 
                        alt={post.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt ? format(post.publishedAt.toDate(), "d MMM yyyy", { locale: it }) : "Bozza"}
                      </div>
                      <h3 className="text-xl font-bold font-headline group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Col sinistra */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-secondary text-white p-1.5 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-headline font-bold text-xl">Nexus Digital Bridge</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La piattaforma italiana per il matching intelligente tra scuole e aziende. Valorizziamo il talento degli studenti attraverso tecnologia e connessioni reali.
              </p>
            </div>

            {/* Col centro */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Link Utili</h3>
              <ul className="space-y-2">
                {[
                  { label: "Home", href: "/" },
                  { label: "Chi Siamo", href: "/about" },
                  { label: "Prezzi", href: "/pricing" },
                  { label: "Blog", href: "/blog" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Termini di Servizio", href: "/terms" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col destra */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Contatti</h3>
              <div className="space-y-3">
                <a href="mailto:info@nexusdigitalbridge.it" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <Mail className="w-4 h-4 shrink-0" />
                  info@nexusdigitalbridge.it
                </a>
                <div className="text-slate-500 text-sm pt-2">
                  Sviluppato da <span className="text-secondary font-semibold">AD Next Lab</span>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-secondary transition-colors text-xs font-medium"
                >
                  <Lock className="w-3 h-3" />
                  Area Riservata Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="container mx-auto px-4 py-5">
            <p className="text-slate-500 text-xs text-center">
              © 2026 Nexus Digital Bridge by AD Next Lab — Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <CardContent className="p-8 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-bold font-headline pt-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-4xl font-bold text-primary font-headline">{value}</div>
      <div className="text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function HowItWorksStep({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center space-y-4 p-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center border-2 border-white">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-bold font-headline text-primary">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
