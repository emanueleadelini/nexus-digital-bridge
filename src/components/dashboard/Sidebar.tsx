
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Briefcase, 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Users, 
  Search,
  Database,
  ArrowRightLeft,
  LogOut,
  Layout,
  Newspaper,
  BarChart3,
  Globe,
  Loader2,
  ListTree
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { clearSessionCookie } from "@/lib/session-cookie";

const commonLinks = [
  { name: "Panoramica", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
];

const companyLinks = [
  { name: "I Miei Match", href: "/dashboard/matches", icon: ArrowRightLeft },
  { name: "Cerca Istituti", href: "/dashboard/search", icon: Search },
  { name: "Profilo Azienda", href: "/dashboard/profile", icon: Briefcase },
];

const instituteLinks = [
  { name: "Studenti (CV)", href: "/dashboard/students", icon: Users },
  { name: "I Miei Match", href: "/dashboard/matches", icon: ArrowRightLeft },
  { name: "Profilo Istituto", href: "/dashboard/profile", icon: GraduationCap },
];

const adminLinks = [
  { name: "Panoramica", href: "/admin", icon: Globe },
  { name: "Dashboard Admin", href: "/admin/dashboard", icon: BarChart3 },
  { name: "Chat Globali", href: "/admin/chats", icon: MessageSquare },
  { name: "Gestione Blog", href: "/admin/blog", icon: Newspaper },
  { name: "Gestione Contenuti", href: "/admin/content", icon: Layout },
  { name: "Settori Confindustria", href: "/admin/sectors", icon: Database },
  { name: "Tipologie Istituti", href: "/admin/institute-types", icon: ListTree },
  { name: "Gestione Utenti", href: "/admin/users", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  // Ruolo dal profilo Firestore. Senza ruolo noto non si mostra nessuna
  // navigazione di ruolo (niente default silenzioso a company).
  const rawRole = userProfile?.role?.toLowerCase();
  const role = rawRole === "company" || rawRole === "institute" || rawRole === "admin" ? rawRole : null;

  // Conteggio utenti in attesa (solo per admin)
  const pendingCompaniesRef = useMemoFirebase(() => {
    if (!db || !user || role !== "admin") return null;
    return query(collection(db, "companies"), where("status", "==", "Pending"));
  }, [db, user, role]);

  const pendingInstitutesRef = useMemoFirebase(() => {
    if (!db || !user || role !== "admin") return null;
    return query(collection(db, "institutes"), where("status", "==", "Pending"));
  }, [db, user, role]);

  const { data: pendingCompanies } = useCollection(pendingCompaniesRef);
  const { data: pendingInstitutes } = useCollection(pendingInstitutesRef);
  const pendingCount = (pendingCompanies?.length || 0) + (pendingInstitutes?.length || 0);

  const links = [
    ...(role === "admin" ? adminLinks : [
      ...commonLinks,
      ...(role === "company" ? companyLinks : []),
      ...(role === "institute" ? instituteLinks : []),
    ]),
  ];

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    clearSessionCookie();
    toast({
      title: "Sessione terminata",
      description: "Hai effettuato il logout correttamente. A presto!",
    });
    router.push("/login");
  };

  if (isProfileLoading) {
    return (
      <div className="w-64 bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  // Senza ruolo noto non si mostra navigazione: errore visibile, mai crash.
  if (!role) {
    return (
      <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-400">Profilo non disponibile. Ricarica o contatta il supporto.</p>
        <button
          onClick={handleLogout}
          className="mt-4 text-sm font-bold text-secondary hover:underline"
        >
          Torna al login
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col sticky top-0 h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-secondary" />
          <span className="font-headline font-bold text-lg tracking-tight">Nexus Bridge</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 flex flex-col justify-between pb-8 overflow-y-auto">
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const showBadge = link.href === "/admin/users" && pendingCount > 0;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-secondary" : "group-hover:text-secondary")} />
                <span className="flex-1">{link.name}</span>
                {showBadge && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-destructive/10 hover:text-destructive group"
            >
              <LogOut className="w-5 h-5 group-hover:text-destructive transition-colors" />
              Esci
            </button>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {(userProfile?.firstName?.[0] || '') + (userProfile?.lastName?.[0] || '') || (role ?? '??').substring(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white truncate">
                {userProfile?.firstName && userProfile?.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : userProfile?.firstName || 'Utente'}
              </div>
              <div className="text-[10px] truncate capitalize text-slate-500">{role}</div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
