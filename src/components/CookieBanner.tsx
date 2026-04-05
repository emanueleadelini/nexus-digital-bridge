"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function handleNecessary() {
    localStorage.setItem("cookie_consent", "necessary");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Questo sito usa cookie tecnici necessari al suo funzionamento e, previo consenso, cookie analitici per migliorare l&apos;esperienza.{" "}
              <Link href="/privacy" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors">
                Leggi la Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNecessary}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Solo necessari
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Accetta tutti
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
