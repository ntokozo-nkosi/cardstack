import Foundation
import SwiftData

protocol CollectionRepository {
    func create(name: String, detail: String?) throws -> DeckCollection
    func update(_ collection: DeckCollection, name: String, detail: String?) throws
    func delete(_ collection: DeckCollection) throws
}

final class SwiftDataCollectionRepository: CollectionRepository {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    func create(name: String, detail: String?) throws -> DeckCollection {
        let collection = DeckCollection(name: name, detail: detail)
        context.insert(collection)
        try context.save()
        return collection
    }

    func update(_ collection: DeckCollection, name: String, detail: String?) throws {
        collection.name = name
        collection.detail = detail
        collection.updatedAt = .now
        try context.save()
    }

    func delete(_ collection: DeckCollection) throws {
        context.delete(collection)
        try context.save()
    }
}
