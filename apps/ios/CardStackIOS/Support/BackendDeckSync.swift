import Foundation
import SwiftData

// Wipes local SwiftData entities and rebuilds them from the backend's
// /v1/decks, /v1/cards, /v1/collections endpoints. The cache is treated as
// disposable: re-running this is always safe and produces a state that
// exactly mirrors the server. Local UUIDs are derived from server UUIDs so
// view lookups by `id` continue to work after a refresh.
enum BackendDeckSync {
    @MainActor
    static func sync(apiClient: any APIClient, context: ModelContext) async {
        do {
            async let summaries: [RemoteDeckSummary] = apiClient.get("/v1/decks")
            async let cards: [RemoteCard] = apiClient.get("/v1/cards")
            async let collectionSummaries: [RemoteCollectionSummary] = apiClient.get("/v1/collections")

            let (resolvedDecks, resolvedCards, resolvedCollectionSummaries) =
                try await (summaries, cards, collectionSummaries)

            // Fetch each collection's deck membership.
            var memberships: [(collectionRemoteId: String, deckRemoteId: String)] = []
            for summary in resolvedCollectionSummaries {
                let detail: RemoteCollectionDetail = try await apiClient.get(
                    "/v1/collections/\(summary.id)"
                )
                for deck in detail.decks {
                    memberships.append((summary.id, deck.id))
                }
            }

            try rebuild(
                decks: resolvedDecks,
                cards: resolvedCards,
                collections: resolvedCollectionSummaries,
                memberships: memberships,
                context: context
            )
        } catch {
            print("Backend resync failed: \(error)")
        }
    }

    @MainActor
    private static func rebuild(
        decks remoteDecks: [RemoteDeckSummary],
        cards remoteCards: [RemoteCard],
        collections remoteCollections: [RemoteCollectionSummary],
        memberships: [(collectionRemoteId: String, deckRemoteId: String)],
        context: ModelContext
    ) throws {
        // Wipe local entities. The order matters because of relationships:
        // cards reference decks; decks list collections; collections list decks.
        try wipe(Card.self, in: context)
        try wipe(Deck.self, in: context)
        try wipe(DeckCollection.self, in: context)

        // Decks first so cards and collections can reference them.
        var deckByRemoteId: [String: Deck] = [:]
        for remote in remoteDecks {
            let deck = Deck(name: remote.name, detail: remote.description)
            if let uuid = UUID(uuidString: remote.id) {
                deck.id = uuid
            }
            deck.remoteId = remote.id
            deck.createdAt = remote.createdAt
            deck.updatedAt = remote.createdAt
            context.insert(deck)
            deckByRemoteId[remote.id] = deck
        }

        // Cards link to their deck via deckId.
        for remote in remoteCards {
            guard let deck = deckByRemoteId[remote.deckId] else { continue }
            let card = Card(
                front: remote.front,
                back: remote.back,
                deck: deck,
                order: 0
            )
            if let uuid = UUID(uuidString: remote.id) {
                card.id = uuid
            }
            card.remoteId = remote.id
            card.createdAt = remote.createdAt
            card.updatedAt = remote.createdAt
            context.insert(card)
        }

        // Collections, then membership rows.
        var collectionByRemoteId: [String: DeckCollection] = [:]
        for remote in remoteCollections {
            let collection = DeckCollection(name: remote.name, detail: remote.description)
            if let uuid = UUID(uuidString: remote.id) {
                collection.id = uuid
            }
            collection.remoteId = remote.id
            collection.createdAt = remote.createdAt
            collection.updatedAt = remote.createdAt
            context.insert(collection)
            collectionByRemoteId[remote.id] = collection
        }

        for membership in memberships {
            guard
                let collection = collectionByRemoteId[membership.collectionRemoteId],
                let deck = deckByRemoteId[membership.deckRemoteId]
            else { continue }
            collection.decks.append(deck)
        }

        try context.save()
    }

    @MainActor
    private static func wipe<T: PersistentModel>(_ type: T.Type, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<T>()
        let existing = try context.fetch(descriptor)
        for item in existing {
            context.delete(item)
        }
    }
}
