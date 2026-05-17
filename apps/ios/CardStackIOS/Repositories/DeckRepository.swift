import Foundation
import SwiftData

// All deck mutations go through the backend; after a successful API call
// the local SwiftData cache is fully rebuilt from the server. The returned
// Deck (for create) is the freshly-cached entity matching the new remote ID.
protocol DeckRepository {
    func create(name: String, detail: String?) async throws -> Deck
    func update(_ deck: Deck, name: String, detail: String?) async throws
    func delete(_ deck: Deck) async throws
}

@MainActor
final class BackendDeckRepository: DeckRepository {
    private let apiClient: any APIClient
    private let context: ModelContext

    init(apiClient: any APIClient, context: ModelContext) {
        self.apiClient = apiClient
        self.context = context
    }

    func create(name: String, detail: String?) async throws -> Deck {
        let body = DeckCreateBody(name: name, description: detail)
        let summary: RemoteDeckSummary = try await apiClient.post("/v1/decks", body: body)
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
        return try fetchDeck(remoteId: summary.id)
    }

    func update(_ deck: Deck, name: String, detail: String?) async throws {
        let remoteId = try requireRemoteId(deck.remoteId)
        let body = DeckUpdateBody(name: name, description: detail)
        let _: RemoteDeckSummary = try await apiClient.put("/v1/decks/\(remoteId)", body: body)
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    func delete(_ deck: Deck) async throws {
        let remoteId = try requireRemoteId(deck.remoteId)
        try await apiClient.delete("/v1/decks/\(remoteId)")
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    private func fetchDeck(remoteId: String) throws -> Deck {
        let descriptor = FetchDescriptor<Deck>(predicate: #Predicate { $0.remoteId == remoteId })
        guard let deck = try context.fetch(descriptor).first else {
            throw RepositoryError.notFoundAfterResync
        }
        return deck
    }

    private func requireRemoteId(_ remoteId: String?) throws -> String {
        guard let remoteId, !remoteId.isEmpty else {
            throw RepositoryError.missingRemoteId
        }
        return remoteId
    }
}

enum RepositoryError: Error {
    case missingRemoteId
    case notFoundAfterResync
}
