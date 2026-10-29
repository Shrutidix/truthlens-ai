import type { Metadata, Viewport } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "TruthLens AI — fake news classifier", template: "%s · TruthLens AI" },
  description: "A TF-IDF + Logistic Regression news classifier with live inference, batch CSV analysis and honest evaluation.",
};
export const viewport: Viewport = { themeColor: "#F8F6F1", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:shadow-lift">
          Skip to content
        </a>
        <Providers>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
