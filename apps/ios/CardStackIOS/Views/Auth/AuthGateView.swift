import ClerkKit
import ClerkKitUI
import SwiftData
import SwiftUI

struct AuthGateView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.modelContext) private var modelContext
    @Environment(Clerk.self) private var clerk
    @State private var showAuthSheet = false
    @State private var isLoadingDecks = false

    // TODO(auth-backend): Listen for backend auth failures from protected API
    // calls. When the backend returns 401 for an invalid session token, call
    // clerk.auth.signOut() and let this gate return the user to signed-out UI.
    var body: some View {
        Group {
            if !clerk.isLoaded {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if clerk.user != nil {
                ZStack {
                    RootView()

                    if isLoadingDecks {
                        DeckLoadingView()
                            .transition(.opacity)
                    }
                }
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
            isLoadingDecks = true
            await BackendDeckSync.sync(apiClient: env.apiClient, context: modelContext)
            isLoadingDecks = false
        }
    }
}

private struct DeckLoadingView: View {
    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .controlSize(.large)
                .tint(Color("BrandPrimary"))

            Text("Loading decks")
                .font(.headline.weight(.semibold))

            Text("Fetching your cards from CardStack.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .fontDesign(.monospaced)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.background)
    }
}
