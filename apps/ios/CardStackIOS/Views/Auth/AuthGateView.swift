import ClerkKit
import ClerkKitUI
import SwiftData
import SwiftUI

struct AuthGateView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.modelContext) private var modelContext
    @Environment(Clerk.self) private var clerk
    @State private var showAuthSheet = false

    // TODO(auth-backend): Listen for backend auth failures from protected API
    // calls. When the backend returns 401 for an invalid session token, call
    // clerk.auth.signOut() and let this gate return the user to signed-out UI.
    var body: some View {
        Group {
            if !clerk.isLoaded {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if clerk.user != nil {
                RootView()
            } else {
                SignedOutLandingView(showAuthSheet: $showAuthSheet)
            }
        }
        .sheet(isPresented: $showAuthSheet) {
            AuthView()
        }
        .prefetchClerkImages()
        .onChange(of: clerk.user?.id) { _, newValue in
            if newValue != nil {
                showAuthSheet = false
            }
        }
        .task(id: clerk.user?.id) {
            guard clerk.isLoaded, clerk.user != nil, let env else { return }
            await BackendDeckSync.sync(apiClient: env.apiClient, context: modelContext)
        }
    }
}
