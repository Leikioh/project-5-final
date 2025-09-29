import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import { AuthProvider } from "@/app/context/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
        </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
