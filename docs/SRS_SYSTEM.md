# CardStack Spaced Repetition System (SRS)

## Table of Contents
- [Overview](#overview)
- [What is SM-2?](#what-is-sm-2)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Button Behaviors](#button-behaviors)
- [Card Lifecycle Examples](#card-lifecycle-examples)
- [Components](#components)
- [User Experience Flow](#user-experience-flow)

---

## Overview

CardStack uses a hybrid spaced repetition system based on the **SuperMemo-2 (SM-2) algorithm** with custom enhancements for in-session review. The system intelligently schedules flashcards for optimal learning by showing cards just before you're likely to forget them.

### Key Features
- **SM-2 algorithm** for long-term scheduling
- **Adaptive in-session review** for failed cards
- **Due date filtering** to show only relevant cards
- **Toggle between "due cards" and "study all"** modes
- **Persistent state** across sessions

---

## What is SM-2?

SuperMemo-2 is a spaced repetition algorithm created by Piotr Woźniak in 1987. It calculates the optimal time to review information based on:

1. **How well you know it** (ease factor)
2. **How many times you've successfully recalled it** (repetitions)
3. **Your performance on the last review** (quality rating)

### Core Concept: The Forgetting Curve

```
Memory
  ^
  |     ╱╲
  |    ╱  ╲___
  |   ╱       ╲___
  |  ╱            ╲___
  | ╱                 ╲___
  |╱_____________________╲___________> Time

   Review here ↑ (just before forgetting)
```

The algorithm aims to schedule reviews **just before** you forget, maximizing retention while minimizing study time.

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Study      │  │  Progress    │  │   Toggle     │      │
│  │   Buttons    │  │   Counter    │  │  Due/All     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LOGIC                          │
│                                                              │
│  • Filters cards by due_date                                │
│  • Manages study queue                                      │
│  • Handles "Again" card re-insertion                        │
│  • Tracks session progress                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓ API Call
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                              │
│                                                              │
│  POST /api/cards/[id]/review                                │
│  • Validates user ownership                                 │
│  • Calls database function                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                       │
│                                                              │
│  Function: record_card_review_sm2()                         │
│  • Maps button → quality (0-5)                              │
│  • Applies SM-2 algorithm                                   │
│  • Calculates new interval & ease factor                    │
│  • Sets due_date timestamp                                  │
│  • Saves state                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. Initial State: New Card

When a card is created, it starts with default SM-2 values:

```
Card {
  repetitions: 0           // No successful reviews yet
  ease_factor: 2.50        // Default multiplier
  interval_days: 0         // Not scheduled yet
  due_date: NOW            // Available immediately
  is_new: true            // Never reviewed
}
```

### 2. User Reviews Card

User clicks one of four buttons: **Again**, **Hard**, **Good**, or **Easy**

```
Button Click → Quality Score Mapping:

Again  → 0  (Complete failure)
Hard   → 2  (Incorrect, but remembered after seeing answer)
Good   → 4  (Correct after hesitation)
Easy   → 5  (Perfect recall)
```

### 3. SM-2 Algorithm Calculates New Values

**Pseudocode:**
```
IF quality >= 3 THEN (Correct response)
  IF repetitions = 0 THEN
    interval = 1 day
  ELSE IF repetitions = 1 THEN
    interval = 6 days
  ELSE
    interval = previous_interval × ease_factor
  END IF
  repetitions = repetitions + 1

ELSE IF quality = 0 THEN (Again button)
  interval = ~1 minute
  repetitions = 0

ELSE (Hard button)
  interval = 1 day
  repetitions = 0
END IF

// Update ease factor based on difficulty
ease_factor = ease_factor + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
IF ease_factor < 1.3 THEN ease_factor = 1.3

// Set when card is next due
due_date = NOW + interval
```

### 4. Card is Scheduled

The card now knows **exactly when** it should appear again:

```
Card {
  repetitions: 1
  ease_factor: 2.50
  interval_days: 1
  due_date: 2026-01-15 10:30:00  ← Tomorrow at this time
  is_new: false
}
```

### 5. User Returns Tomorrow

Frontend filters cards:
```
NOW = 2026-01-15 14:00:00

FOR EACH card IN deck:
  IF card.due_date <= NOW THEN
    Add to study queue
  END IF
END FOR

Card due_date (10:30) <= Current time (14:00) ✅
→ Card appears in study queue
```

---

## Button Behaviors

### Summary Table

| Button | Quality | Queue Behavior | Due Date | Repetitions | Use Case |
|--------|---------|----------------|----------|-------------|----------|
| **Again** | 0 | Re-insert randomly (3-10 cards ahead) | +1 minute | Reset to 0 | "I have no idea" |
| **Hard** | 2 | Remove from queue | +1 day | Reset to 0 | "I got it wrong but barely" |
| **Good** | 4 | Remove from queue | +1/6/X days | +1 | "I knew it after thinking" |
| **Easy** | 5 | Remove from queue | Longer intervals | +1 | "Instant recall" |

### Detailed Behavior

#### 🔴 Again (In-Session Review)
**Special hybrid behavior** - different from standard SM-2:

```
┌─────────────────────────────────────────┐
│ Current Queue: [A, B, C, D, E, F, G, H] │
│                                         │
│ User clicks "Again" on card A           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 1. Database: Set due_date = NOW + 1min  │
│ 2. Frontend: Remove A from position 0   │
│ 3. Calculate random insert position:    │
│    - Queue size 8 → insert after 3-7    │
│    - Random picks: 5                    │
│ 4. Insert A at position 5               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ New Queue: [B, C, D, E, F, A, G, H]     │
│                                         │
│ Result: See card A again after 5 cards  │
│         (~2 minutes of study)           │
└─────────────────────────────────────────┘
```

**Adaptive Insertion Logic:**
```
Queue Size         | Insert After
-------------------|-------------
≤ 5 cards         | 1-3 cards (near end)
6-15 cards        | 3-7 cards (medium wait)
> 15 cards        | 5-10 cards (longer wait, but not too long)
```

**Why This Approach?**
- ✅ **Not immediate:** Get a mental break before seeing the card again
- ✅ **Not too late:** Don't wait 20+ cards (could be 10+ minutes)
- ✅ **Unpredictable:** Random position feels more natural
- ✅ **Persistent:** If you close the app, card is still due in 1 minute

#### 🟡 Hard (Tomorrow Review)
```
Click "Hard" on card
    ↓
Database: due_date = NOW + 1 day
Frontend: Remove from queue (you'll see it tomorrow)
    ↓
Tomorrow at this time: Card appears again
```

#### 🟢 Good (Standard SM-2)
```
Click "Good" on card
    ↓
First time:     due_date = NOW + 1 day
Second time:    due_date = NOW + 6 days
Third+ time:    due_date = NOW + (previous_interval × ease_factor)
    ↓
Remove from queue (scheduled for future)
```

#### 🔵 Easy (Accelerated SM-2)
```
Click "Easy" on card
    ↓
Same as "Good" BUT:
- Ease factor increases (future intervals grow faster)
- Card graduates to long-term memory quicker
```

---

## Card Lifecycle Examples

### Example 1: Struggling with a Card

```
Day 1:  Review card → Click "Again"
        State: due in 1 minute, repetitions = 0
        Result: Card re-appears after 3-7 more cards in session

        Review again → Click "Hard"
        State: due tomorrow, repetitions = 0

Day 2:  Review card → Click "Hard" (still struggling)
        State: due tomorrow again, repetitions = 0

Day 3:  Review card → Click "Good" (finally got it!)
        State: due in 1 day, repetitions = 1

Day 4:  Review card → Click "Good"
        State: due in 6 days, repetitions = 2

Day 10: Review card → Click "Good"
        State: due in 15 days (6 × 2.5 ease factor), repetitions = 3
```

**Result:** Card graduates from "struggling" (daily) to "mastered" (2+ weeks)

### Example 2: Easy Card Path

```
Day 1:  Review card → Click "Easy"
        State: due in 1 day, repetitions = 1, ease_factor = 2.60

Day 2:  Review card → Click "Easy"
        State: due in 6 days, repetitions = 2, ease_factor = 2.70

Day 8:  Review card → Click "Easy"
        State: due in 16 days (6 × 2.70), repetitions = 3, ease_factor = 2.80

Day 24: Review card → Click "Easy"
        State: due in 45 days (16 × 2.80), repetitions = 4
```

**Result:** Card quickly moves to long-term memory (monthly reviews)

### Example 3: Forgetting a Mature Card

```
Day 1-60: Card successfully reviewed 5 times
          Current state: due in 90 days, repetitions = 5, ease_factor = 2.80

Day 151:  Review card (overdue by 1 day) → Click "Hard"
          State: due tomorrow, repetitions = 0, ease_factor = 2.35 (decreased)

Day 152:  Review card → Click "Good"
          State: due in 1 day, repetitions = 1, ease_factor = 2.35

Day 153:  Review card → Click "Good"
          State: due in 6 days, repetitions = 2
```

**Result:** Card recognized as "forgotten" and restarts the learning cycle, but keeps lower ease factor (won't jump to 90 days immediately)

---

## Components

### Database Schema

**Cards Table (SM-2 Fields):**
```
repetitions       INTEGER     → Successful review streak
ease_factor       NUMERIC     → Interval growth multiplier (1.3 - 3.0+)
interval_days     NUMERIC     → Days until next review (can be fractional)
due_date          TIMESTAMP   → Exact time card is next due
is_new           BOOLEAN     → Whether card has ever been reviewed
```

**Database Function:**
```
record_card_review_sm2(card_id, user_id, response)
  ↓
1. Map response to quality (0-5)
2. Get current card state
3. Apply SM-2 algorithm
4. Calculate new interval & ease factor
5. Set due_date = NOW + interval
6. Save to database
7. Return new values
```

### Frontend Logic

**Card Filtering:**
```
fetchDeck()
  ↓
Get all cards from deck
  ↓
IF showing "due cards only" THEN
  Filter: due_date <= NOW
ELSE
  Show all cards
END IF
  ↓
Sort by due_date ASC (most overdue first)
  ↓
Display in study queue
```

**Queue Management:**
```
handleResponse(button)
  ↓
IF button = "Again" THEN
  Calculate random position (3-10 cards ahead)
  Insert card at that position
  (Don't increment completed count)
ELSE
  Remove card from queue
  Increment completed count
  (SM-2 handles future scheduling)
END IF
```

### API Layer

**Endpoint:** `POST /api/cards/[id]/review`

```
Request:  { response: "again" | "hard" | "good" | "easy" }
  ↓
1. Validate user owns the card
2. Call database function
3. Return SM-2 results
  ↓
Response: {
  success: true,
  interval: 1,
  easeFactor: 2.5,
  repetitions: 1,
  dueDate: "2026-01-15T10:30:00Z"
}
```

---

## User Experience Flow

### Starting a Study Session

```
User clicks "Study" button
        ↓
┌─────────────────────────────────────┐
│ Frontend: Fetch deck from database  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Filter cards by due_date            │
│                                     │
│ NOW = 2026-01-14 15:00:00          │
│                                     │
│ Card A: due 2026-01-13 ✅ (overdue) │
│ Card B: due 2026-01-14 14:00 ✅     │
│ Card C: due 2026-01-14 16:00 ❌     │
│ Card D: due 2026-01-20 ❌           │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Queue: [Card A, Card B]             │
│ Total in session: 2                 │
│ Progress: 0 of 2                    │
└─────────────────────────────────────┘
```

### During Study Session

```
Show Card A (front side)
        ↓
User clicks "Flip"
        ↓
Show Card A (back side)
        ↓
User clicks "Hard"
        ↓
┌─────────────────────────────────────┐
│ 1. API: Save review to database     │
│    due_date = NOW + 1 day           │
│                                     │
│ 2. Queue: Remove Card A             │
│    Queue = [Card B]                 │
│                                     │
│ 3. Progress: 1 of 2                 │
└─────────────────────────────────────┘
        ↓
Show Card B (next in queue)
```

### Completing Session

```
Last card reviewed
        ↓
Queue is now empty
        ↓
┌─────────────────────────────────────┐
│ Show completion screen:             │
│                                     │
│ "All done for now!"                 │
│                                     │
│ Options:                            │
│ • Back to Deck                      │
│ • Refresh (check for new due cards) │
│ • Study all cards (toggle mode)     │
└─────────────────────────────────────┘
```

---

## Study Mode Toggle

Users can switch between two modes:

### Due Cards Only (Default)
```
┌────────────────────────────────┐
│ Show only: due_date <= NOW     │
│                                │
│ Deck has 50 cards total        │
│ → 5 cards are due now          │
│ → Queue shows 5 cards          │
│                                │
│ "Study all cards" button shown │
└────────────────────────────────┘
```

### Study All Cards
```
┌────────────────────────────────┐
│ Show all cards in deck         │
│                                │
│ Deck has 50 cards total        │
│ → Queue shows all 50 cards     │
│ → Sorted by due_date ASC       │
│                                │
│ "Due cards only" button shown  │
└────────────────────────────────┘
```

**Use cases for "Study all":**
- Cramming before an exam
- Reviewing newly imported cards
- Testing yourself on mastered material

---

## Progress Tracking

### Session-Based Progress

```
Session starts:
  totalCardsInSession = 10  (number of due cards)
  completedCount = 0

After reviewing 3 cards:
  totalCardsInSession = 10  (stays constant!)
  completedCount = 3
  Progress: "3 of 10" (30%)

If you click "Again" on a card:
  totalCardsInSession = 10  (unchanged)
  completedCount = 3        (unchanged - card not "completed")
  Card moves to back of queue
```

**Key insight:** Total stays constant so users know how many cards they started with, even if "Again" cards cycle through the queue multiple times.

---

## Data Persistence

All SM-2 state is stored in the database, so:

✅ **Session recovery:** Close the app mid-session → Reopen → Cards that were due 1 minute ago are still available
✅ **Cross-device:** Study on phone → Switch to desktop → Same due dates
✅ **Historical data:** `review_count`, `last_reviewed_at`, `last_response` tracked for future analytics
✅ **Algorithm evolution:** Can adjust SM-2 parameters without losing user data

---

## Future Enhancements (Not Yet Implemented)

### Session Tracking
Track entire study sessions with statistics:
- Session duration
- Cards reviewed per session
- Accuracy rates (Again/Hard vs Good/Easy ratio)
- Study streaks

### Advanced Features
- **Daily limits:** Max 20 new cards per day
- **Deck statistics:** Show mature vs learning cards
- **Bury cards:** Temporarily hide a card until tomorrow
- **Custom intervals:** Override SM-2 with manual scheduling
- **Learning vs review mode:** Separate queues for new vs mature cards

---

## Summary

CardStack's SRS is a **hybrid system**:

1. **SM-2 algorithm** provides scientifically-proven long-term scheduling
2. **Custom "Again" logic** keeps failed cards in the current session with smart randomization
3. **Due date filtering** ensures you only see relevant cards
4. **Session persistence** via database timestamps
5. **Adaptive behavior** based on queue size

This combination gives you the benefits of spaced repetition while maintaining a smooth, natural study experience.
