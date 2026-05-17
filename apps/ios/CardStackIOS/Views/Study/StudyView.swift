import SwiftUI

struct StudyView: View {
    @Environment(\.dismiss) private var dismiss
    let deck: Deck

    @State private var currentIndex: Int = 0
    @State private var flipped: Bool = false
    @State private var showExitConfirmation: Bool = false

    private var isActiveSession: Bool {
        totalCount > 0 && !isComplete
    }

    private var sortedCards: [Card] {
        deck.cards.sorted { $0.order < $1.order }
    }

    private var totalCount: Int { sortedCards.count }
    private var isComplete: Bool { currentIndex >= totalCount && totalCount > 0 }
    private var progress: Double {
        totalCount == 0 ? 0 : min(Double(currentIndex) / Double(totalCount), 1)
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)

            Spacer()

            if totalCount == 0 {
                EmptyStateView(
                    systemImage: "rectangle.stack",
                    title: "No cards to study",
                    message: "Add a card to this deck to start studying."
                )
            } else if isComplete {
                completionView
            } else if let card = currentCard {
                FlashcardView(
                    front: card.front,
                    back: card.back,
                    flipped: $flipped
                )
                .id(card.id)
                .padding(.horizontal, 20)
            }

            Spacer()

            if !isComplete && currentCard != nil {
                responseButtons
                    .padding(.horizontal, 16)
                    .padding(.bottom, 20)
            }
        }
        .fontDesign(.monospaced)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
        .onAppear {
            NavigationPopGuard.shared.shouldAllowPop = { !isActiveSession }
            NavigationPopGuard.shared.onBlockedPop = { showExitConfirmation = true }
        }
        .onDisappear {
            NavigationPopGuard.shared.shouldAllowPop = nil
            NavigationPopGuard.shared.onBlockedPop = nil
        }
        .alert("End study session?", isPresented: $showExitConfirmation) {
            Button("Keep Studying", role: .cancel) {}
            Button("End Session", role: .destructive) { dismiss() }
        } message: {
            Text("Are you sure you want to end this session?")
        }
    }

    private var topBar: some View {
        HStack(alignment: .top, spacing: 16) {
            Button {
                if isActiveSession {
                    showExitConfirmation = true
                } else {
                    dismiss()
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.left")
                    Text("Back to Deck")
                }
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.primary)
            }
            .buttonStyle(.plain)

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                HStack(spacing: 6) {
                    Text("Progress")
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                    Text("\(min(currentIndex, totalCount)) of \(totalCount)")
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color("BrandPrimary").opacity(0.18))
                        .frame(width: 140, height: 6)
                    GeometryReader { geo in
                        Capsule()
                            .fill(Color("BrandPrimary"))
                            .frame(width: 140 * progress, height: 6)
                    }
                    .frame(width: 140, height: 6)
                }
            }
        }
    }

    private var currentCard: Card? {
        guard currentIndex < sortedCards.count else { return nil }
        return sortedCards[currentIndex]
    }

    private var completionView: some View {
        VStack(spacing: 14) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color("BrandPrimary"))
            Text("Great job!")
                .font(.title.weight(.bold))
            Text("You've completed this deck.")
                .font(.callout)
                .foregroundStyle(.secondary)
            Button {
                currentIndex = 0
                flipped = false
            } label: {
                Text("Study Again")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 14)
                    .background(Color("BrandPrimary"), in: Capsule())
            }
            .buttonStyle(.plain)
            .padding(.top, 8)
        }
        .padding(.horizontal, 24)
    }

    private var responseButtons: some View {
        HStack(spacing: 8) {
            responseButton(
                title: "Again", subtitle: "Didn't know",
                icon: "xmark", color: Color(red: 0.85, green: 0.30, blue: 0.30), filled: false
            ) { advance() }

            responseButton(
                title: "Hard", subtitle: "Barely knew",
                icon: nil, color: Color(red: 0.95, green: 0.55, blue: 0.20), filled: false
            ) { advance() }

            responseButton(
                title: "Good", subtitle: "Knew it",
                icon: nil, color: Color(red: 0.45, green: 0.45, blue: 0.45), filled: false
            ) { advance() }

            responseButton(
                title: "Easy", subtitle: "Too easy",
                icon: "checkmark", color: Color(red: 0.40, green: 0.70, blue: 0.50), filled: true
            ) { advance() }
        }
        .animation(.easeInOut(duration: 0.2), value: flipped)
    }

    private func responseButton(
        title: String,
        subtitle: String,
        icon: String?,
        color: Color,
        filled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    if let icon {
                        Image(systemName: icon)
                            .font(.footnote.weight(.bold))
                    }
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                }
                Text(subtitle)
                    .font(.caption2)
                    .opacity(0.8)
            }
            .foregroundStyle(filled ? Color.white : color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                filled ? color : color.opacity(0.08),
                in: .rect(cornerRadius: 10)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(filled ? Color.clear : color.opacity(0.4), lineWidth: 1)
            )
            .opacity(flipped ? 1 : 0.40)
        }
        .buttonStyle(.plain)
        .disabled(!flipped)
    }

    private func advance() {
        flipped = false
        if currentIndex < totalCount {
            currentIndex += 1
        }
    }
}
