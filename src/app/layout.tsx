import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#0A0A0B] dark:text-zinc-100 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}