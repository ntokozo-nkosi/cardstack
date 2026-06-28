import Foundation

struct GeneratedCard {
    let front: String
    let back: String
}

protocol CardGenerationService {
    func generateCards(from prompt: String, count: Int) async throws -> [GeneratedCard]
}

struct NoopCardGenerationService: CardGenerationService {
    func generateCards(from prompt: String, count: Int) async throws -> [GeneratedCard] {
        []
    }
}
