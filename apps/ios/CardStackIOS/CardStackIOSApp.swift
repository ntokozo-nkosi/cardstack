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
            let apiClient: any APIClient = BackendAPIClient(
                sessionTokenProvider: {
                    try await clerk.session?.getToken()
                },
                userIDProvider: {
                    clerk.user?.id
                }
            )
            let env = AppEnvironment(
                apiClient: apiClient,
                collections: BackendCollectionRepository(apiClient: apiClient, context: context),
                decks: BackendDeckRepository(apiClient: apiClient, context: context),
                cards: BackendCardRepository(apiClient: apiClient, context: context),
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
