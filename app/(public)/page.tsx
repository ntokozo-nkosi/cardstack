import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-2">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            CardStack
          </h1>
        </div>

        {/* Simple Description */}
        <p className="text-muted-foreground text-lg">
          Simple, effective flashcards for learning.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto min-w-[120px]"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors w-full sm:w-auto min-w-[120px]"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
