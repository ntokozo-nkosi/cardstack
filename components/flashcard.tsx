'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'

interface FlashcardProps {
  front: string
  back: string
}

export function Flashcard({ front, back }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <Card
      className="w-full h-96 cursor-pointer select-none transition-all hover:shadow-xl"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-4">
            {isFlipped ? 'Back' : 'Front'}
          </div>
          <div className="text-2xl whitespace-pre-wrap">
            {isFlipped ? back : front}
          </div>
          <div className="text-sm text-muted-foreground mt-8">
            Click to flip
          </div>
        </div>
      </div>
    </Card>
  )
}
