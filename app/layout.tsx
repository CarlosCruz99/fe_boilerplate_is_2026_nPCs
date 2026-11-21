import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: { default: "Strikers by NPCs", template: "%s | Strikers by NPCs" },
  description: "Gestiona tu liga: equipos, partidos, estadísticas y pagos en un solo lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider><AppShell>{children}</AppShell></AuthProvider>
      </body>
    </html>
  );
}
