import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/(Navbar)/Navbar";
import Footer from "./components/Footer";
import ToastProvider from "./components/(Toast)/ToastProvider";

export const metadata: Metadata = {
  title: "Mini Learning Management System",
  description:
    "Corporate training teams need a lightweight LMS where instructors publish courses with video lessons and quizzes, and employees can enroll, track progress, and earn completion certificates. The key challenge is accurate progress tracking that resumes exactly where the learner left off.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen flex flex-col bg-linear-to-br from-gray-50 to-gray-200 px-6">
          <div className="flex-1 flex items-center justify-center">
            <ToastProvider>{children}</ToastProvider>
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
