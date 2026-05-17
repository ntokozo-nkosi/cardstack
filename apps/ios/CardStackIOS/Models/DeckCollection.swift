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

    @Relationship(deleteRule: .cascade, inverse: \Deck.collection)
    var decks: [Deck] = []

    init(name: String, detail: String? = nil) {
        self.id = UUID()
        self.name = name
        self.detail = detail
        self.createdAt = .now
        self.updatedAt = .now
    }
}
