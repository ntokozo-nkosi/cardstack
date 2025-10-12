'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Play } from 'lucide-react'

interface DeckCardProps {
  deck: {
    id: string
    name: string
    description: string | null
    _count: {
      cards: number
    }
  }
  onEdit: () => void
  onDelete: () => void
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-1">{deck.name}</CardTitle>
        {deck.description && (
          <CardDescription className="line-clamp-2">
            {deck.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">
          {deck._count.cards} {deck._count.cards === 1 ? 'card' : 'cards'}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link href={`/decks/${deck.id}`}>
            View
          </Link>
        </Button>
        {deck._count.cards > 0 && (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/decks/${deck.id}/study`}>
              <Play className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
