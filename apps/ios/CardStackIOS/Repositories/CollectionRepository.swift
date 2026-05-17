import Foundation
import SwiftData

protocol CollectionRepository {
    func create(name: String, detail: String?) async throws -> DeckCollection
    func update(_ collection: DeckCollection, name: String, detail: String?) async throws
    func delete(_ collection: DeckCollection) async throws
    func add(deck: Deck, to collection: DeckCollection) async throws
    func remove(deck: Deck, from collection: DeckCollection) async throws
}

@MainActor
final class BackendCollectionRepository: CollectionRepository {
    private let apiClient: any APIClient
    private let context: ModelContext

    init(apiClient: any APIClient, context: ModelContext) {
        self.apiClient = apiClient
        self.context = context
    }

    func create(name: String, detail: String?) async throws -> DeckCollection {
        let body = CollectionCreateBody(name: name, description: detail)
        let summary: RemoteCollectionSummary = try await apiClient.post("/v1/collections", body: body)
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
        return try fetchCollection(remoteId: summary.id)
    }

    func update(_ collection: DeckCollection, name: String, detail: String?) async throws {
        let remoteId = try requireRemoteId(collection.remoteId)
        let body = CollectionUpdateBody(name: name, description: detail)
        let _: RemoteCollectionSummary = try await apiClient.put(
            "/v1/collections/\(remoteId)",
            body: body
        )
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    func delete(_ collection: DeckCollection) async throws {
        let remoteId = try requireRemoteId(collection.remoteId)
        try await apiClient.delete("/v1/collections/\(remoteId)")
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    func add(deck: Deck, to collection: DeckCollection) async throws {
        let deckRemoteId = try requireRemoteId(deck.remoteId)
        let collectionRemoteId = try requireRemoteId(collection.remoteId)
        let body = AddDeckToCollectionBody(deckId: deckRemoteId)
        try await apiClient.postNoContent(
            "/v1/collections/\(collectionRemoteId)/decks",
            body: body
        )
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    func remove(deck: Deck, from collection: DeckCollection) async throws {
        let deckRemoteId = try requireRemoteId(deck.remoteId)
        let collectionRemoteId = try requireRemoteId(collection.remoteId)
        try await apiClient.delete(
            "/v1/collections/\(collectionRemoteId)/decks/\(deckRemoteId)"
        )
        await BackendDeckSync.sync(apiClient: apiClient, context: context)
    }

    private func fetchCollection(remoteId: String) throws -> DeckCollection {
        let descriptor = FetchDescriptor<DeckCollection>(
            predicate: #Predicate { $0.remoteId == remoteId }
        )
        guard let collection = try context.fetch(descriptor).first else {
            throw RepositoryError.notFoundAfterResync
        }
        return collection
    }

    private func requireRemoteId(_ remoteId: String?) throws -> String {
        guard let remoteId, !remoteId.isEmpty else {
            throw RepositoryError.missingRemoteId
        }
        return remoteId
    }
}

