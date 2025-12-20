# CardStack

A clean, simple flashcard app for creating and studying decks.

## Features

- **Deck Management**: Create, edit, and delete flashcard decks
- **Card Management**: Add cards with front/back content to any deck
- **Study Mode**: Practice with shuffled cards and click-to-flip interaction
- **Mobile Friendly**: Fully responsive design for all screen sizes

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **PostgreSQL** - Database (Neon)
- **Goose** - Database migrations
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Setup

1. **Prerequisites**
   - Install [Doppler CLI](https://docs.doppler.com/docs/cli) and setup your account
   - This project uses Doppler for managing secrets and environment variables

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run database migrations**
   ```bash
   make migrate
   ```

4. **Run the development server**
   ```bash
   make dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Makefile Commands

This project uses a Makefile for common development tasks. All commands automatically handle Doppler secrets:

```bash
make dev          # Start development server
make build        # Build the application
make migrate      # Apply database migrations
make migration    # Create new migration (requires name=your_migration_name)
make rollback     # Roll back the last migration
make reset        # Reset all migrations
make hard-reset   # Drop and recreate database schema
```

## Project Structure

```
app/
├── api/              # API routes for decks and cards
├── decks/[id]/       # Deck detail and study pages
└── page.tsx          # Home page (deck grid)
components/           # React components
database/
└── migrations/       # SQL migrations managed by Goose
lib/
└── database.ts       # PostgreSQL connection pool
```

## License

MIT
