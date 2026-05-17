import ClerkKit
import SwiftData
import SwiftUI

@main
struct CardStackIOSApp: App {
    let container: ModelContainer

    init() {
        Clerk.configure(publishableKey: ClerkConfig.publishableKey)
        do {
            container = try ModelContainer(
                for: DeckCollection.self, Deck.self, Card.self
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            let context = container.mainContext
            let env = AppEnvironment(
                // TODO(auth-backend): Replace local-only SwiftData reads with
                // backend-backed read paths once GET /v1/decks is protected by
                // Clerk. SwiftData can remain as a cache or temporary local store.
                collections: SwiftDataCollectionRepository(context: context),
                decks: SwiftDataDeckRepository(context: context),
                cards: SwiftDataCardRepository(context: context),
                cardGeneration: NoopCardGenerationService(),
                speech: NoopSpeechService()
            )

            AuthGateView()
                .modelContainer(container)
                .environment(\.appEnvironment, env)
                .environment(Clerk.shared)
                .tint(Color("BrandPrimary"))
                .preferredColorScheme(.light)
                .task {
                    SeedData.runIfNeeded(env: env)
                }
        }
    }
}
