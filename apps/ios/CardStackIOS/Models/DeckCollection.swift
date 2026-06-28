import Foundation
import SwiftData

@Model
final class DeckCollection {
    @Attribute(.unique) var id: UUID
    var name: String
    var detail: String?
    var createdAt: Date
    var updatedAt: Date
    var remoteId: String?

    // Many-to-many: a deck can live in multiple collections, and deleting a
    // collection should NOT delete its decks (matches the backend's
    // ON DELETE CASCADE on collection_decks.collection_id, which only
    // unassigns membership rows).
    @Relationship(inverse: \Deck.collections)
    var decks: [Deck] = []

    init(name: String, detail: String? = nil) {
        self.id = UUID()
        self.name = name
        self.detail = detail
        self.createdAt = .now
        self.updatedAt = .now
    }
}
