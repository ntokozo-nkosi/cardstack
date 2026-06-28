import Foundation
import SwiftData

protocol CardRepository {
    func create(front: String, back: String, in deck: Deck) async throws -> Card
    func update(_ card: Card, front: String, back: String, newDeck: Deck?) async throws
    func delete(_ card: Card) async throws
}

@MainActor
final class BackendCardRepository: CardRepository {
    private let apiClient: any APIClient
    private let context: ModelContext

    init(apiClient: any APIClient, context: ModelContext) {
        self.apiClient = apiClient
        self.context = context
    }

    func create(front: String, back: String, in deck: Deck) async throws -> Card {
        let deckRemoteId = try requireRemoteId(deck.remoteId)
        let body = CardCreateBody(
            front: String(front.prefix(200)),
            back: String(back.prefix(200))
        )
        let card: RemoteCard = try await apiClient.post(
            "/v1/decks/\(deckRemoteId)/cards",
            body: body
        )
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
        return try fetchCard(remoteId: card.id)
    }

    func update(_ card: Card, front: String, back: String, newDeck: Deck?) async throws {
        let remoteId = try requireRemoteId(card.remoteId)
        let body = CardUpdateBody(
            front: String(front.prefix(200)),
            back: String(back.prefix(200)),
            deckId: newDeck?.remoteId
        )
        let _: RemoteCard = try await apiClient.put("/v1/cards/\(remoteId)", body: body)
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    func delete(_ card: Card) async throws {
        let remoteId = try requireRemoteId(card.remoteId)
        try await apiClient.delete("/v1/cards/\(remoteId)")
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    private func fetchCard(remoteId: String) throws -> Card {
        let descriptor = FetchDescriptor<Card>(predicate: #Predicate { $0.remoteId == remoteId })
        guard let card = try context.fetch(descriptor).first else {
            throw RepositoryError.notFoundAfterResync
        }
        return card
    }

    private func requireRemoteId(_ remoteId: String?) throws -> String {
        guard let remoteId, !remoteId.isEmpty else {
            throw RepositoryError.missingRemoteId
        }
        return remoteId
    }
}
