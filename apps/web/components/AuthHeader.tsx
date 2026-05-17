import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'

export function AuthHeader() {
    return (
        <header className="flex justify-end items-center p-4 gap-4 h-16 border-b bg-background">
            <SignedOut>
                <SignInButton />
                <SignUpButton>
                    <button className="bg-primary text-primary-foreground rounded-md font-medium text-sm h-9 px-4 cursor-pointer hover:bg-primary/90 transition-colors">
                        Sign Up
                    </button>
                </SignUpButton>
            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn>
        </header>
    )
}
