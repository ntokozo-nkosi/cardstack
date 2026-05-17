import Foundation

protocol APIClient {
    func get<T: Decodable>(_ path: String) async throws -> T
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T
    func put<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T
    func delete(_ path: String) async throws
}

enum APIClientError: Error {
    case missingBaseURL
    case invalidBaseURL(String)
    case invalidResponse
    case requestFailed(statusCode: Int)
}

struct BackendAPIClient: APIClient {
    typealias SessionTokenProvider = () async throws -> String?
    typealias UserIDProvider = () -> String?

    private let baseURL: URL
    private let session: URLSession
    private let sessionTokenProvider: SessionTokenProvider
    private let userIDProvider: UserIDProvider
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(
        session: URLSession = .shared,
        sessionTokenProvider: @escaping SessionTokenProvider,
        userIDProvider: @escaping UserIDProvider
    ) {
        guard let rawBaseURL = Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String,
              !rawBaseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            fatalError("Missing API_BASE_URL. Generate apps/ios/CardStackIOS/Config/Secrets.xcconfig.")
        }
        guard let baseURL = URL(string: rawBaseURL) else {
            fatalError("Invalid API_BASE_URL: \(rawBaseURL)")
        }

        self.baseURL = baseURL
        self.session = session
        self.sessionTokenProvider = sessionTokenProvider
        self.userIDProvider = userIDProvider
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await send(path: path, method: "GET", body: Optional<Data>.none)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await send(path: path, method: "POST", body: encoder.encode(body))
    }

    func put<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await send(path: path, method: "PUT", body: encoder.encode(body))
    }

    func delete(_ path: String) async throws {
        let _: EmptyResponse = try await send(path: path, method: "DELETE", body: Optional<Data>.none)
    }

    private func send<T: Decodable>(path: String, method: String, body: Data?) async throws -> T {
        let url = baseURL.appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        if let token = try await sessionTokenProvider() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let userID = userIDProvider() {
            request.setValue(userID, forHTTPHeaderField: "X-CardStack-User-ID")
        }

        // TODO(auth-backend): Convert 401 responses into an auth failure that
        // signs the user out.
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }
        guard 200..<300 ~= httpResponse.statusCode else {
            throw APIClientError.requestFailed(statusCode: httpResponse.statusCode)
        }

        if T.self == EmptyResponse.self, data.isEmpty {
            return EmptyResponse() as! T
        }

        return try decoder.decode(T.self, from: data)
    }
}

private struct EmptyResponse: Decodable {}
