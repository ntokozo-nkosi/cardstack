import Foundation

// TODO(auth-backend): Implement a concrete backend API client that reads
// API_BASE_URL from Info.plist, retrieves Clerk's session token with
// clerk.auth.getToken(), sends Authorization: Bearer <token>, decodes JSON,
// and converts 401 responses into an auth failure the app can use to sign out.
protocol APIClient {
    func get<T: Decodable>(_ path: String) async throws -> T
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T
    func put<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T
    func delete(_ path: String) async throws
}
