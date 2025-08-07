// app/layout.tsx
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import "./globals.css"; 

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />  
          {children}  
        </Providers>
      </body>
    </html>
  );
}
