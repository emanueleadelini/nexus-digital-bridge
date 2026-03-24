
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight text-primary">
                Nexus <span className="text-secondary">Digital Bridge</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Aziende
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Istituti
            </Link>
            <div className="flex items-center gap-3 pl-6 border-l">
              <Button variant="ghost" asChild>
                <Link href="/login">Accedi</Link>
              </Button>
              <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl" asChild>
                <Link href="/register">Registrati</Link>
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-2">
          <Link href="/login" className="block px-3 py-2 text-base font-medium hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>Aziende</Link>
          <Link href="/login" className="block px-3 py-2 text-base font-medium hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>Istituti</Link>
          <hr />
          <Link href="/login" className="block px-3 py-2 text-base font-medium hover:bg-muted rounded-md" onClick={() => setIsMenuOpen(false)}>Accedi</Link>
          <Link href="/register" className="block px-3 py-2 text-base font-medium hover:bg-muted rounded-md font-bold text-secondary" onClick={() => setIsMenuOpen(false)}>Registrati</Link>
        </div>
      )}
    </nav>
  );
}
