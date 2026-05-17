import Foundation

// DTOs for the FastAPI /v1/* surface. Field names match the wire shape: camelCase
// everywhere, with `_count` mapped to `counts` via CodingKeys because Swift
// identifiers can't begin with an underscore in a clean way.

struct RemoteDeckCount: Decodable {
    let cards: Int
    let due: Int
}

struct RemoteCollectionCount: Decodable {
    let decks: Int
}

struct RemoteDeckSummary: Decodable {
    let id: String
    let name: String
    let description: String?
    let createdAt: Date
    let counts: RemoteDeckCount

    enum CodingKeys: String, CodingKey {
        case id, name, description, createdAt
        case counts = "_count"
    }
}

struct RemoteCard: Decodable {
    let id: String
    let deckId: String
    let front: String
    let back: String
    let createdAt: Date
    let lastResponse: String?
    let lastReviewedAt: Date?
    let reviewCount: Int
    let repetitions: Int
    let easeFactor: Double
    let intervalDays: Double
    let dueDate: Date?
    let isNew: Bool
}

struct RemoteDeckDetail: Decodable {
    let id: String
    let name: String
    let description: String?
    let createdAt: Date
    let cards: [RemoteCard]
}

struct RemoteCollectionSummary: Decodable {
    let id: String
    let name: String
    let description: String?
    let createdAt: Date
    let counts: RemoteCollectionCount

    enum CodingKeys: String, CodingKey {
        case id, name, description, createdAt
        case counts = "_count"
    }
}

struct RemoteCollectionDetail: Decodable {
    let id: String
    let name: String
    let description: String?
    let createdAt: Date
    let decks: [RemoteDeckSummary]
}

// Request bodies

struct DeckCreateBody: Encodable {
    let name: String
    let description: String?
}

struct DeckUpdateBody: Encodable {
    let name: String
    let description: String?
}

struct CardCreateBody: Encodable {
    let front: String
    let back: String
}

struct CardUpdateBody: Encodable {
    let front: String
    let back: String
    let deckId: String?
}

struct CollectionCreateBody: Encodable {
    let name: String
    let description: String?
}

struct CollectionUpdateBody: Encodable {
    let name: String
    let description: String?
}

struct AddDeckToCollectionBody: Encodable {
    let deckId: String
}
