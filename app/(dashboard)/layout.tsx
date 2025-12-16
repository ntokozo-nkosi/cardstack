"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { AuthHeader } from "@/components/AuthHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isStudyMode = pathname?.endsWith("/study");

    // Study mode gets a clean layout without sidebar
    if (isStudyMode) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AuthHeader />
                <MobileHeader />
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
