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
      className="w-full h-64 sm:h-80 md:h-96 cursor-pointer select-none transition-all hover:shadow-xl"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flex items-center justify-center h-full p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {isFlipped ? 'Back' : 'Front'}
          </div>
          <div className="text-lg sm:text-xl md:text-2xl whitespace-pre-wrap break-words">
            {isFlipped ? back : front}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 md:mt-8">
            Tap to flip
          </div>
        </div>
      </div>
    </Card>
  )
}
