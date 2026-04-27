import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
