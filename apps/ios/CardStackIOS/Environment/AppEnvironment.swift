import SwiftUI

struct AppEnvironment {
    let apiClient: any APIClient
    let collections: any CollectionRepository
    let decks: any DeckRepository
    let cards: any CardRepository
    let cardGeneration: any CardGenerationService
    let speech: any SpeechService
}

private struct AppEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppEnvironment? = nil
}

extension EnvironmentValues {
    var appEnvironment: AppEnvironment? {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}
