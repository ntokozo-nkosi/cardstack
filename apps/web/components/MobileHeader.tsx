"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="md:hidden flex h-14 shrink-0 items-center border-b bg-white px-4">
      <button
        onClick={toggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={22} className="text-gray-600" />
      </button>
    </header>
  );
}
