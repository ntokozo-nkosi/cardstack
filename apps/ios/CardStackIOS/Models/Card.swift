import Foundation
import SwiftData

@Model
final class Card {
    @Attribute(.unique) var id: UUID
    var front: String
    var back: String
    var order: Int
    var createdAt: Date
    var updatedAt: Date
    var remoteId: String?

    var deck: Deck?

    init(front: String, back: String, deck: Deck? = nil, order: Int = 0) {
        self.id = UUID()
        self.front = String(front.prefix(200))
        self.back = String(back.prefix(200))
        self.deck = deck
        self.order = order
        self.createdAt = .now
        self.updatedAt = .now
    }
}
