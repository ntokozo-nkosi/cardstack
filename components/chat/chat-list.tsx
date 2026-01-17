'use client'

import { useState } from 'react'
import { useChats } from '@/hooks/use-chats'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, MoreVertical, Trash2 } from 'lucide-react'
import {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useChatStore } from '@/lib/stores/chat-store'
import { toast } from 'sonner'

export function ChatList() {
  const { chats, isLoading } = useChats()
  const pathname = usePathname()
  const router = useRouter()
  const deleteChat = useChatStore((state) => state.deleteChat)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!chatToDelete) return

    const success = await deleteChat(chatToDelete)

    if (success) {
      toast.success('Conversation deleted')
      // Redirect if deleting current chat
      if (pathname === `/chat/${chatToDelete}`) {
        router.push('/chat')
      }
    } else {
      toast.error('Failed to delete conversation')
    }

    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  if (isLoading || chats.length === 0) {
    return null
  }

  return (
    <>
      <SidebarMenuSub>
        {chats.map((chat) => (
          <SidebarMenuSubItem key={chat.id} className="group/item">
            <SidebarMenuSubButton
              onClick={() => router.push(`/chat/${chat.id}`)}
              isActive={pathname === `/chat/${chat.id}`}
              className="truncate"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{chat.title}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setChatToDelete(chat.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete conversation?"
        description="This will permanently delete this conversation and all its messages."
        confirmText="Delete"
      />
    </>
  )
}
