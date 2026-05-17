import SwiftUI

struct DeckDetailView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss
    let deck: Deck

    @State private var showCreateCard = false
    @State private var editingCard: Card?
    @State private var pendingDelete: Card?
    @State private var navigateToStudy = false

    private var sortedCards: [Card] {
        deck.cards.sorted { $0.order < $1.order }
    }

    private let columns = [
        GridItem(.adaptive(minimum: 280, maximum: 420), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                backButton
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                Text(deck.name)
                    .font(.title.weight(.bold))
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)
                    .padding(.horizontal, 20)

                if let detail = deck.detail, !detail.isEmpty {
                    Text(detail)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 20)
                }

                statsRow
                    .padding(.horizontal, 20)

                Button {
                    navigateToStudy = true
                } label: {
                    Text("Study Deck")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color("BrandPrimary"), in: Capsule())
                        .opacity(sortedCards.isEmpty ? 0.5 : 1)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
                .padding(.top, 2)
                .padding(.bottom, 6)
                .disabled(sortedCards.isEmpty)

                if sortedCards.isEmpty {
                    EmptyStateView(
                        systemImage: "rectangle.stack",
                        title: "No cards yet",
                        message: "Tap + to add your first flashcard."
                    )
                    .frame(minHeight: 220)
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(sortedCards) { card in
                            CardPreviewTile(
                                card: card,
                                onTap: { editingCard = card },
                                onDelete: { pendingDelete = card }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 100)
        }
        .fontDesign(.monospaced)
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .bottomTrailing) {
            Button {
                showCreateCard = true
            } label: {
                Image(systemName: "plus")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Color("BrandPrimary"), in: Circle())
                    .shadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 4)
            }
            .buttonStyle(.plain)
            .padding(.trailing, 20)
            .padding(.bottom, 20)
            .accessibilityLabel("New Card")
        }
        .navigationDestination(isPresented: $navigateToStudy) {
            StudyView(deck: deck)
        }
        .sheet(isPresented: $showCreateCard) {
            CardEditorSheet(deck: deck, editing: nil)
        }
        .sheet(item: $editingCard) { card in
            CardEditorSheet(deck: deck, editing: card)
        }
        .alert(
            "Delete card?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            presenting: pendingDelete
        ) { card in
            Button("Delete", role: .destructive) {
                if let env {
                    Task { try? await env.cards.delete(card) }
                }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This cannot be undone.")
        }
    }

    private var backButton: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.left")
                    Text("Back to Decks")
                }
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.primary)
            }
            .buttonStyle(.plain)
            Spacer()
        }
    }

    private var statsRow: some View {
        HStack(spacing: 10) {
            Text("\(sortedCards.count) \(sortedCards.count == 1 ? "card" : "cards")")
                .font(.footnote)
                .foregroundStyle(.secondary)

            Text("·")
                .font(.footnote)
                .foregroundStyle(.tertiary)

            HStack(spacing: 6) {
                Text("\(sortedCards.count)")
                    .font(.footnote.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .foregroundStyle(Color("BrandPrimary"))
                    .background(Color("BrandPrimary").opacity(0.12), in: Capsule())
                Text("due")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
