# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CardStack is a flashcard learning application built with Next.js 16 (App Router), TypeScript, PostgreSQL (Neon), and Clerk authentication. Users can create decks of flashcards, organize them into collections, and study using an interactive study mode.

## Environment Setup

This project uses **Doppler CLI** for secrets management. All environment variables are managed through Doppler, not local `.env` files. See `.env.example` for required variables:

## Development Commands

All commands use Doppler to inject environment variables:

```bash
make dev          # Start development server (uses Turbopack)
make build        # Build for production (uses Turbopack)
npm run lint      # Run ESLint
```

## Database Management

Database migrations are managed by **Goose** using `DATABASE_URL_UNPOOLED` (direct connection to avoid pooler issues):

```bash
make migrate                           # Apply all pending migrations
make migration name=migration_name     # Create new migration (SQL file in database/migrations/)
make rollback                          # Roll back the last migration
make reset                             # Reset all migrations
make hard-reset                        # Drop and recreate schema (destructive!)
```

Migration files follow the pattern: `YYYYMMDDHHMMSS_name.sql` with `-- +goose Up` and `-- +goose Down` sections.
Never Create migration file manually - always use `make migration` 

## Architecture

### Route Structure

Next.js App Router with route groups for layout separation:

- `app/(public)/` - Unauthenticated routes (landing page, sign-in/sign-up via Clerk)
- `app/(dashboard)/` - Authenticated routes with sidebar navigation
  - `/decks` - Deck management and listing
  - `/decks/[id]` - Individual deck details
  - `/decks/[id]/study` - Study mode (clean layout, no sidebar)
  - `/collections` - Collection management
  - `/collections/[id]` - Collection details with decks
  - `/flashcards` - View all flashcards across all decks
- `app/api/` - REST API routes
  - `/api/decks` - Deck CRUD operations
  - `/api/decks/[id]/cards` - Card operations within a deck
  - `/api/decks/[id]/import` - Bulk CSV import
  - `/api/cards` - Card operations
  - `/api/cards/bulk` - Bulk card operations
  - `/api/collections` - Collection CRUD
  - `/api/collections/[id]/decks` - Add/remove decks from collections

### Layout System

- Root layout (`app/layout.tsx`): ClerkProvider, ThemeProvider, global fonts
- Dashboard layout (`app/(dashboard)/layout.tsx`): Conditionally renders sidebar
  - Standard pages: AppSidebar + MobileHeader + content
  - Study mode (`/decks/[id]/study`): Clean layout without sidebar

### Database Schema

Core tables:
- `users` - Links to Clerk user IDs
- `decks` - User-owned flashcard decks
- `cards` - Flashcards within decks (front/back text)
- `collections` - User-owned groupings of decks
- `collection_decks` - Junction table linking collections to decks

### Database Functions

PostgreSQL functions handle complex queries and ownership checks in a single round-trip:

- `get_or_create_user(clerk_id, email)` - Upserts user from Clerk data
- `get_deck_with_cards(deck_id, user_id)` - Returns deck + all cards as JSON
- `get_collection_with_decks(collection_id, user_id)` - Returns collection + decks as JSON
- `get_all_user_cards(user_id)` - Returns all cards with deck info as JSON
- `update_card_if_owned(card_id, user_id, front, back)` - Updates card with ownership verification
- `delete_card_if_owned(card_id, user_id)` - Deletes card with ownership verification
- `add_deck_to_collection_if_owned(...)` - Adds deck to collection with checks
- `remove_deck_from_collection_if_owned(...)` - Removes deck from collection

These functions ensure authorization at the database level and reduce query complexity.

### Database Connection

`lib/database.ts` provides a PostgreSQL connection pool using the `pg` library. It exports a `query(text, values)` function for parameterized queries. All queries use this pool with SSL enabled.

### Authentication

Clerk handles all authentication. Access user info via:
```typescript
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
```

User records are automatically created/updated in PostgreSQL via `get_or_create_user()` function.

### Component Structure

- `components/ui/` - shadcn/ui components (Button, Dialog, Card, Sidebar, etc.) (never make edit to this folder)
- `components/` - Application-specific components:
  - Dialog components for creating/editing entities
  - `AppSidebar` - Desktop navigation
  - `MobileHeader` - Mobile navigation
  - `flashcard.tsx` - Interactive flip card component
  - `deck-card.tsx` - Deck display card with stats

### Styling

- Tailwind CSS 4.x with PostCSS
- Custom color scheme in `app/globals.css` using CSS variables
- Dark mode support via `next-themes` (light default, respects system preference)
- Responsive design with mobile-first approach

## Code Conventions

- Use TypeScript with strict type checking
- Server Components by default, "use client" only when necessary
- API routes return JSON responses with appropriate status codes
- All database queries use parameterised statements to prevent SQL injection
- User ownership checks are performed in database functions or API routes
- Use Clerk's `auth()` for server-side auth checks
