import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "../globals.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(250,250,255,0.9),rgba(255,255,255,1))] dark:bg-[radial-gradient(ellipse_at_top,rgba(9,9,11,0.9),rgba(0,0,0,1))]">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}