import Foundation

struct RemoteCardPayload: Decodable {
    let id: String
    let front: String
    let back: String
    let order: Int
}

struct RemoteDeckPayload: Decodable {
    let id: String
    let name: String
    let detail: String?
    let cards: [RemoteCardPayload]
}
