import SwiftUI

struct BrowseView: View {
    let deck: Deck

    @State private var currentIndex: Int = 0
    @State private var flipped: Bool = false
    @State private var dragOffset: CGFloat = 0

    private var sortedCards: [Card] {
        deck.cards.sorted { $0.order < $1.order }
    }

    var body: some View {
        Group {
            if sortedCards.isEmpty {
                EmptyStateView(
                    systemImage: "square.stack",
                    title: "No cards to browse",
                    message: "Add a card to this deck to start browsing."
                )
            } else {
                let safeIndex = min(currentIndex, sortedCards.count - 1)
                let card = sortedCards[safeIndex]

                VStack(spacing: 24) {
                    Spacer()

                    FlashcardView(
                        front: card.front,
                        back: card.back,
                        flipped: $flipped
                    )
                    .id(card.id)
                    .offset(x: dragOffset)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                dragOffset = value.translation.width
                            }
                            .onEnded { value in
                                handleDragEnd(translation: value.translation.width)
                            }
                    )
                    .padding(.horizontal, 16)

                    Spacer()

                    HStack(spacing: 32) {
                        Button {
                            goPrevious()
                        } label: {
                            Image(systemName: "chevron.left")
                                .font(.title2)
                                .frame(width: 44, height: 44)
                        }
                        .buttonStyle(.bordered)
                        .disabled(safeIndex == 0)

                        Text("\(safeIndex + 1) / \(sortedCards.count)")
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(minWidth: 60)

                        Button {
                            goNext()
                        } label: {
                            Image(systemName: "chevron.right")
                                .font(.title2)
                                .frame(width: 44, height: 44)
                        }
                        .buttonStyle(.bordered)
                        .disabled(safeIndex >= sortedCards.count - 1)
                    }
                    .padding(.bottom, 24)
                }
            }
        }
        .navigationTitle(deck.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func handleDragEnd(translation: CGFloat) {
        let threshold: CGFloat = 50
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            if translation < -threshold {
                goNext()
            } else if translation > threshold {
                goPrevious()
            }
            dragOffset = 0
        }
    }

    private func goNext() {
        guard currentIndex < sortedCards.count - 1 else { return }
        flipped = false
        currentIndex += 1
    }

    private func goPrevious() {
        guard currentIndex > 0 else { return }
        flipped = false
        currentIndex -= 1
    }
}
