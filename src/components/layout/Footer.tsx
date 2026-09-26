import Link from "next/link";
import { GraduationCap, ChevronRight, Mail, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-12">
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
  );
}
