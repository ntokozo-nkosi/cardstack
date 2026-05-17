import SwiftUI

struct SignedOutLandingView: View {
    @Binding var showAuthSheet: Bool

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 12) {
                Image(systemName: "rectangle.stack.fill")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundStyle(Color("BrandPrimary"))

                Text("CardStack")
                    .font(.largeTitle.weight(.bold))

                Text("Flashcards that move with you.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            Button {
                showAuthSheet = true
            } label: {
                Text("Sign in or sign up")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color("BrandPrimary"))
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
        .fontDesign(.monospaced)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}
