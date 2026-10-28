import type { Metadata } from "next";
import "./globals.css"; // Solo importa la configuración base de Tailwind y variables CSS

export const metadata: Metadata = {
  title: "Mini Wallet Web App",
  description: "PoC de wallet digital: flujo transaccional con datos simulados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
