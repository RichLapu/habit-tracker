import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rastreador de Hábitos",
  description: "Eleve sua rotina ao próximo nível",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Diz ao navegador que somos um PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-256.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers> 

        {/* Instala o Service Worker no PC do usuário */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { 
                      console.log('Service Worker registrado com sucesso com escopo: ', registration.scope); 
                    },
                    function(err) { 
                      console.log('Falha ao registrar o Service Worker: ', err); 
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}