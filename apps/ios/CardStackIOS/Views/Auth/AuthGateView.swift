import ClerkKit
import ClerkKitUI
import SwiftUI

struct AuthGateView: View {
    @Environment(Clerk.self) private var clerk
    @State private var showAuthSheet = false

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
    }
}
