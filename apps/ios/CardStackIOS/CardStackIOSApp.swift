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
            let clerk = Clerk.shared
            let env = AppEnvironment(
                apiClient: BackendAPIClient(
                    sessionTokenProvider: {
                        try await clerk.auth.getToken()
                    },
                    userIDProvider: {
                        clerk.user?.id
                    }
                ),
                collections: SwiftDataCollectionRepository(context: context),
                decks: SwiftDataDeckRepository(context: context),
                cards: SwiftDataCardRepository(context: context),
                cardGeneration: NoopCardGenerationService(),
                speech: NoopSpeechService()
            )

            AuthGateView()
                .modelContainer(container)
                .environment(\.appEnvironment, env)
                .environment(clerk)
                .tint(Color("BrandPrimary"))
                .preferredColorScheme(.light)
        }
    }
}
