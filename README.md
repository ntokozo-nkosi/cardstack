# CardStack

A clean, simple flashcard app for creating and studying decks.

## Features

- **Deck Management**: Create, edit, and delete flashcard decks
- **Card Management**: Add cards with front/back content to any deck
- **Study Mode**: Practice with shuffled cards and click-to-flip interaction
- **Mobile Friendly**: Fully responsive design for all screen sizes
- **Clean UI**: Built with shadcn/ui components

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **PostgreSQL** - Database (Neon)
- **Goose** - Database migrations
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ntokozo-nkosi/cardstack.git
   cd cardstack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Add your Neon database connection string to `.env`:
   ```
   DATABASE_URL="your_neon_connection_string"
   ```

4. **Run database migrations**
   ```bash
   make migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Database Commands

Using the Makefile with Goose:
```bash
make migration    # Create a new migration file
make migrate      # Apply all pending migrations
make rollback     # Roll back the last migration
make reset        # Reset all migrations
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
