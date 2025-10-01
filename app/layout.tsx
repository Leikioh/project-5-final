// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import { AuthProvider } from "@/app/context/AuthContext";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "CookHub — Recettes faciles & gourmandes",
    template: "%s | CookHub",
  },
  description:
    "Trouvez, cuisinez et partagez des milliers de recettes savoureuses. Recherche rapide, favoris, commentaires, et plus.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CookHub",
    url: baseUrl + "/",
    locale: "fr_FR",
    images: [
      { url: "/images/og-home.jpg", width: 1200, height: 630, alt: "CookHub — Recettes" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CookHub — Recettes faciles & gourmandes",
    description:
      "Trouvez, cuisinez et partagez des milliers de recettes savoureuses.",
    images: ["/images/og-home.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {/* Lien d’évitement pour l’accessibilité */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:m-4 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Passer au contenu principal
        </a>

        <AuthProvider>
          <Providers>
            <Navbar />
            <main id="content" className="pt-16">
              {children}
            </main>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
