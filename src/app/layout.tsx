import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: {
    default: 'Nexus Digital Bridge — Il Ponte tra Talento e Opportunità',
    template: '%s | Nexus Digital Bridge',
  },
  description: 'Colleghiamo Istituti Scolastici e Aziende attraverso un sistema di matching intelligente basato sui settori merceologici reali. Valorizziamo il futuro degli studenti.',
  keywords: ['PCTO', 'alternanza scuola lavoro', 'matching aziende scuole', 'orientamento professionale', 'Nexus Digital Bridge'],
    openGraph: {
      type: 'website',
      locale: 'it_IT',
      url: 'https://nexusdigitalbridge.it',
      siteName: 'Nexus Digital Bridge',
      title: 'Nexus Digital Bridge — Connettendo Scuola e Lavoro',
      description: 'La piattaforma intelligente per il matching tra studenti e aziende.',
      images: [{ url: 'https://picsum.photos/seed/nexus-og/1200/630', width: 1200, height: 630 }],
    },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus Digital Bridge',
    description: 'Il ponte digitale tra talento e opportunità.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <FirebaseClientProvider>
          {children}
          <CookieBanner />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}