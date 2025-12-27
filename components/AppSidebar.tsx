"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Layers, FolderOpen, SquareStack, Bot, Plus } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChatList } from "@/components/chat/chat-list";

import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarFooter } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";



export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const { user, isLoaded } = useUser();
  const isCollapsed = state === "collapsed";
  const [chatOpen, setChatOpen] = useState(true);

  const isDecksActive = pathname?.startsWith('/decks') || pathname === '/' || false;
  const isFlashcardsActive = pathname?.startsWith('/flashcards') || false;
  const isChatActive = pathname?.startsWith('/chat') || false;

  return (
    <>
      <Sidebar className="border-r border-sidebar-border" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border bg-sidebar p-4 group-data-[collapsible=icon]:p-2">
          {/* ... existing header content ... */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold shrink-0">
              C
            </div>
            <h2 className="text-base font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">CardStack</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar">
          {/* ... existing content ... */}
          <SidebarGroup className="px-3 py-4 group-data-[collapsible=icon]:px-2">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {/* AI Chat Section */}
                <SidebarMenuItem>
                  <Collapsible open={chatOpen && !isCollapsed} onOpenChange={setChatOpen}>
                    <div className="flex items-center">
                      <SidebarMenuButton
                        onClick={() => router.push('/chat')}
                        isActive={isChatActive}
                        className="flex-1 px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary rounded-lg transition-colors"
                        tooltip="AI Chat"
                      >
                        <Bot size={16} className="shrink-0" />
                        <span className="text-sm group-data-[collapsible=icon]:hidden">AI Chat</span>
                      </SidebarMenuButton>

                      {/* New chat button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 group-data-[collapsible=icon]:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/chat');
                        }}
                        title="New chat"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      {/* Collapse toggle */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 group-data-[collapsible=icon]:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className={cn("h-4 w-4 transition-transform", chatOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <ChatList limit={5} />
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/flashcards')}
                    isActive={isFlashcardsActive}
                    className="w-full px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary rounded-lg transition-colors"
                    tooltip="Flashcards"
                  >
                    <SquareStack size={16} className="shrink-0" />
                    <span className="text-sm group-data-[collapsible=icon]:hidden">Flashcards</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/decks')}
                    isActive={isDecksActive}
                    className="w-full px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary rounded-lg transition-colors"
                    tooltip="Decks"
                  >
                    <Layers size={16} className="shrink-0" />
                    <span className="text-sm group-data-[collapsible=icon]:hidden">Decks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/collections')}
                    isActive={pathname?.startsWith('/collections')}
                    className="w-full px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary rounded-lg transition-colors"
                    tooltip="Collections"
                  >
                    <FolderOpen size={16} className="shrink-0" />
                    <span className="text-sm group-data-[collapsible=icon]:hidden">Collections</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-4 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-2 justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 min-w-0">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">
                  {isLoaded ? (user?.fullName || user?.username || "User") : "Loading..."}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {isLoaded ? (user?.primaryEmailAddress?.emailAddress) : ""}
                </span>
              </div>
            </div>
            <div className="group-data-[collapsible=icon]:hidden shrink-0">
              <ModeToggle />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Fixed floating toggle button in the middle - hidden on mobile */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 h-8 w-8 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        style={{
          left: isCollapsed ? 'calc(var(--sidebar-width-icon, 3rem) - 1.25rem)' : 'calc(var(--sidebar-width, 16rem) - 1.25rem)'
        }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>
    </>
  );
}
