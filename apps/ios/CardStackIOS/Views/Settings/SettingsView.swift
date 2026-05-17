import ClerkKit
import SwiftUI

struct SettingsView: View {
    @Environment(Clerk.self) private var clerk
    @State private var isSigningOut = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Settings")
                    .font(.largeTitle.weight(.bold))
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                Text("Manage your account and preferences")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 16)

                VStack(alignment: .leading, spacing: 24) {
                    accountSection
                    accountActionsSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 10)
            }
            .padding(.bottom, 32)
            .fontDesign(.monospaced)
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ACCOUNT")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .tracking(1.5)

            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color("BrandPrimary"))

                VStack(alignment: .leading, spacing: 2) {
                    if let name = displayName {
                        Text(name)
                            .font(.callout.weight(.semibold))
                    }
                    if let email = clerk.user?.primaryEmailAddress?.emailAddress {
                        Text(email)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(14)
            .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(Color(.separator), lineWidth: 1)
            )
        }
    }

    private var accountActionsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ACCOUNT ACTIONS")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .tracking(1.5)

            Button(role: .destructive) {
                signOut()
            } label: {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                    Text("Sign out")
                        .font(.callout.weight(.semibold))
                    Spacer()
                    if isSigningOut {
                        ProgressView()
                    }
                }
                .padding(14)
                .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color(.separator), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .foregroundStyle(.red)
            .disabled(isSigningOut)
        }
    }

    private var displayName: String? {
        let first = clerk.user?.firstName ?? ""
        let last = clerk.user?.lastName ?? ""
        let combined = [first, last].filter { !$0.isEmpty }.joined(separator: " ")
        return combined.isEmpty ? nil : combined
    }

    private func signOut() {
        isSigningOut = true
        Task {
            try? await clerk.auth.signOut()
            isSigningOut = false
        }
    }
}
