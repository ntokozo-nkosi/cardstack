import SwiftData
import SwiftUI

@main
struct CardStackIOSApp: App {
    let container: ModelContainer

    init() {
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
                collections: SwiftDataCollectionRepository(context: context),
                decks: SwiftDataDeckRepository(context: context),
                cards: SwiftDataCardRepository(context: context),
                cardGeneration: NoopCardGenerationService(),
                speech: NoopSpeechService()
            )

            RootView()
                .modelContainer(container)
                .environment(\.appEnvironment, env)
                .tint(Color("BrandPrimary"))
                .task {
                    SeedData.runIfNeeded(env: env)
                }
        }
    }
}
