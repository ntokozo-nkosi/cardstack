import Foundation
import SwiftData

protocol CardRepository {
    func create(front: String, back: String, in deck: Deck) throws -> Card
    func update(_ card: Card, front: String, back: String) throws
    func delete(_ card: Card) throws
}

final class SwiftDataCardRepository: CardRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func create(front: String, back: String, in deck: Deck) throws -> Card {
        let order = deck.cards.count
        let card = Card(
            front: String(front.prefix(200)),
            back: String(back.prefix(200)),
            deck: deck,
            order: order
        )
        context.insert(card)
        deck.updatedAt = .now
        try context.save()
        return card
    }

    func update(_ card: Card, front: String, back: String) throws {
        card.front = String(front.prefix(200))
        card.back = String(back.prefix(200))
        card.updatedAt = .now
        try context.save()
    }

    func delete(_ card: Card) throws {
        context.delete(card)
        try context.save()
    }
}
