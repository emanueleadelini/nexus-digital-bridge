
"use client";

import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp, Users, MessageSquare, Newspaper, Layout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPanoramicaPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-primary">Panoramica Piattaforma</h1>
              <p className="text-slate-500">Benvenuto nella console di controllo. Ecco cosa succede oggi su Nexus.</p>
            </div>
            <div className="bg-slate-900 text-white p-3 rounded-2xl">
              <Globe className="w-8 h-8 text-secondary" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <QuickActionCard 
              title="Gestione Utenti" 
              desc="Verifica profili e approvazioni" 
              href="/admin/users" 
              icon={<Users className="w-6 h-6" />}
              color="bg-blue-500"
            />
            <QuickActionCard 
              title="Blog & News" 
              desc="Pubblica articoli e annunci" 
              href="/admin/blog" 
              icon={<Newspaper className="w-6 h-6" />}
              color="bg-orange-500"
            />
            <QuickActionCard 
              title="Landing Page" 
              desc="Aggiorna testi e immagini" 
              href="/admin/content" 
              icon={<Layout className="w-6 h-6" />}
              color="bg-purple-500"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Andamento Settimanale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="text-center space-y-2">
                    <p className="text-slate-400 font-medium">Analisi in corso...</p>
                    <p className="text-[10px] text-slate-300 uppercase font-bold">Integrazione Recharts necessaria</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-primary text-white">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest font-bold opacity-80">Messaggi Oggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold font-headline">24</div>
                    <MessageSquare className="w-12 h-12 text-secondary opacity-30" />
                  </div>
                  <p className="text-xs mt-4 text-blue-100">+12% rispetto a ieri</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Stato Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-slate-600">Database: Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-slate-600">Storage: Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-slate-600">Auth Service: Online</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickActionCard({ title, desc, href, icon, color }: any) {
  return (
    <Link href={href}>
      <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-2xl shadow-lg shadow-${color}/20 group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
