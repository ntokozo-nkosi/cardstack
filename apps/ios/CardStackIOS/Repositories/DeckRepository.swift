import Foundation
import SwiftData

protocol DeckRepository {
    func create(name: String, detail: String?, in collection: DeckCollection?) throws -> Deck
    func update(_ deck: Deck, name: String, detail: String?, collection: DeckCollection?) throws
    func delete(_ deck: Deck) throws
}

final class SwiftDataDeckRepository: DeckRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func create(name: String, detail: String?, in collection: DeckCollection?) throws -> Deck {
        let deck = Deck(name: name, detail: detail, collection: collection)
        context.insert(deck)
        try context.save()
        return deck
    }

    func update(_ deck: Deck, name: String, detail: String?, collection: DeckCollection?) throws {
        deck.name = name
        deck.detail = detail
        deck.collection = collection
        deck.updatedAt = .now
        try context.save()
    }

    func delete(_ deck: Deck) throws {
        context.delete(deck)
        try context.save()
    }
}
