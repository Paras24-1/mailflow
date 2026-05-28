import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailFlow - Cold Outreach Automation CRM",
  description: "Production cold-email sequence visualizer and SaaS CRM campaign dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body className="bg-[#09090b] text-[#f4f4f5] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
