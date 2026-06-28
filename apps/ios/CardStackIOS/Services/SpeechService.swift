import Foundation

protocol SpeechService {
    func speak(_ text: String, language: String) async
    func transcribe() async throws -> String
}

struct NoopSpeechService: SpeechService {
    func speak(_ text: String, language: String) async {}
    func transcribe() async throws -> String { "" }
}
