'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface FlashcardProps {
  front: string
  back: string
}

export function Flashcard({
  front,
  back,
  isFlipped: controlledIsFlipped,
  onFlip
}: FlashcardProps & {
  isFlipped?: boolean
  onFlip?: () => void
}) {
  const [internalIsFlipped, setInternalIsFlipped] = useState(false)

  const isFlipped = controlledIsFlipped ?? internalIsFlipped

  const handleClick = () => {
    if (onFlip) {
      onFlip()
    } else {
      setInternalIsFlipped(!internalIsFlipped)
    }
  }

  return (
    <div
      className="w-full h-64 sm:h-80 md:h-96 cursor-pointer select-none"
      onClick={handleClick}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <Card
          className="absolute inset-0 w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 hover:shadow-xl transition-shadow"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center">
            <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Front
            </div>
            <div className="text-lg sm:text-xl md:text-2xl whitespace-pre-wrap break-words">
              {front}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 md:mt-8">
              Tap to flip
            </div>
          </div>
        </Card>

        {/* Back Face */}
        <Card
          className="absolute inset-0 w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 hover:shadow-xl transition-shadow"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">
            <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Back
            </div>
            <div className="text-lg sm:text-xl md:text-2xl whitespace-pre-wrap break-words">
              {back}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 md:mt-8">
              Tap to flip back
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
