'use client'

import { useChats } from '@/hooks/use-chats'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'

export function ChatList() {
  const { chats, isLoading } = useChats()
  const pathname = usePathname()
  const router = useRouter()

  if (isLoading || chats.length === 0) {
    return null
  }

  return (
    <SidebarMenuSub>
      {chats.map((chat) => (
        <SidebarMenuSubItem key={chat.id}>
          <SidebarMenuSubButton
            onClick={() => router.push(`/chat/${chat.id}`)}
            isActive={pathname === `/chat/${chat.id}`}
            className="truncate"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{chat.title}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}
