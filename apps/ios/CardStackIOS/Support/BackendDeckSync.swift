import Foundation
import SwiftData

enum BackendDeckSync {
    @MainActor
    static func sync(apiClient: any APIClient, context: ModelContext) async {
        do {
            let decks: [RemoteDeckPayload] = try await apiClient.get("/v1/decks")
            try upsert(decks: decks, context: context)
        } catch {
            print("Backend deck sync failed: \(error)")
        }
    }

    @MainActor
    private static func upsert(decks remoteDecks: [RemoteDeckPayload], context: ModelContext) throws {
        for remoteDeck in remoteDecks {
            let deck = try findDeck(remoteId: remoteDeck.id, name: remoteDeck.name, context: context)
                ?? Deck(name: remoteDeck.name, detail: remoteDeck.detail)

            if deck.modelContext == nil {
                context.insert(deck)
            }

            deck.remoteId = remoteDeck.id
            deck.name = remoteDeck.name
            deck.detail = remoteDeck.detail
            deck.updatedAt = .now

            for remoteCard in remoteDeck.cards {
                let card = findCard(remoteId: remoteCard.id, front: remoteCard.front, in: deck)
                    ?? Card(front: remoteCard.front, back: remoteCard.back, deck: deck, order: remoteCard.order)

                if card.modelContext == nil {
                    context.insert(card)
                }

                card.remoteId = remoteCard.id
                card.front = String(remoteCard.front.prefix(200))
                card.back = String(remoteCard.back.prefix(200))
                card.order = remoteCard.order
                card.deck = deck
                card.updatedAt = .now
            }
        }

        try context.save()
    }

    @MainActor
    private static func findDeck(remoteId: String, name: String, context: ModelContext) throws -> Deck? {
        let byRemoteId = FetchDescriptor<Deck>(
            predicate: #Predicate { $0.remoteId == remoteId }
        )
        if let deck = try context.fetch(byRemoteId).first {
            return deck
        }

        let byName = FetchDescriptor<Deck>(
            predicate: #Predicate { $0.name == name }
        )
        return try context.fetch(byName).first
    }

    private static func findCard(remoteId: String, front: String, in deck: Deck) -> Card? {
        deck.cards.first { card in
            card.remoteId == remoteId || card.front == front
        }
    }
}
