import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@repo/ui/components/shadcn/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Stats Dashboard - Repository Analytics",
    description: "Comprehensive repository statistics and coverage visualization",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en dark">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
                <SidebarProvider defaultOpen={true}>
                    <AppSidebar>
                        {children}
                    </AppSidebar>
                </SidebarProvider>
            </body>
        </html>
    );
}
