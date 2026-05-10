import Foundation
import SwiftData

@Model
final class Deck {
    @Attribute(.unique) var id: UUID
    var name: String
    var detail: String?
    var createdAt: Date
    var updatedAt: Date
    var remoteId: String?

    var collection: DeckCollection?

    @Relationship(deleteRule: .cascade, inverse: \Card.deck)
    var cards: [Card] = []

    init(name: String, detail: String? = nil, collection: DeckCollection? = nil) {
        self.id = UUID()
        self.name = name
        self.detail = detail
        self.collection = collection
        self.createdAt = .now
        self.updatedAt = .now
    }
}
