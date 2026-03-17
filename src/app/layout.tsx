import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { UserProvider } from "@/lib/UserContext";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundAnimation } from "@/components/BackgroundAnimation"; // <-- добавь импорт

export const metadata: Metadata = {
  title: "LogiFlow — Система управления логистикой",
  description: "Платформа для управления грузоперевозками",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <BackgroundAnimation /> {/* <-- добавь сюда */}
        <ThemeProvider>
          <UserProvider>
            {children}
            <Toaster position="top-right" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
