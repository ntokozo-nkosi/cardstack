"use client";

import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const isDecksActive = pathname?.startsWith('/decks') || pathname === '/' || false;

  return (
    <>
      <Sidebar className="border-r border-gray-200" collapsible="icon">
        <SidebarHeader className="border-b border-gray-200 bg-white p-4 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shrink-0">
              C
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-data-[collapsible=icon]:hidden">CardStack</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white">
          <SidebarGroup className="px-3 py-4 group-data-[collapsible=icon]:px-2">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/decks')}
                    isActive={isDecksActive}
                    className="w-full px-3 py-2 hover:bg-gray-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 rounded-lg transition-colors"
                    tooltip="Decks"
                  >
                    <Layers size={16} className="shrink-0" />
                    <span className="text-sm group-data-[collapsible=icon]:hidden">Decks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      {/* Fixed floating toggle button in the middle - hidden on mobile */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        style={{ 
          left: isCollapsed ? 'calc(var(--sidebar-width-icon, 3rem) - 1.25rem)' : 'calc(var(--sidebar-width, 16rem) - 1.25rem)'
        }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={20} className="text-gray-700" />
        ) : (
          <ChevronLeft size={20} className="text-gray-700" />
        )}
      </button>
    </>
  );
}
