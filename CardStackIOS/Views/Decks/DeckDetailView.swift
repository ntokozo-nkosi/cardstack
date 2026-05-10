import SwiftUI

struct DeckDetailView: View {
    @Environment(\.appEnvironment) private var env
    let deck: Deck

    @State private var showCreateCard = false
    @State private var editingCard: Card?
    @State private var pendingDelete: Card?
    @State private var navigateToBrowse = false

    private var sortedCards: [Card] {
        deck.cards.sorted { $0.order < $1.order }
    }

    var body: some View {
        List {
            Section {
                if let detail = deck.detail, !detail.isEmpty {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Button {
                    navigateToBrowse = true
                } label: {
                    Label("Browse Cards", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
                .disabled(deck.cards.isEmpty)
            }

            Section("Cards (\(deck.cards.count))") {
                if sortedCards.isEmpty {
                    Text("No cards yet. Tap + to add one.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(sortedCards) { card in
                        Button {
                            editingCard = card
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(card.front)
                                    .font(.subheadline.weight(.medium))
                                    .lineLimit(1)
                                    .foregroundStyle(.primary)
                                Text(card.back)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                            .padding(.vertical, 2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                pendingDelete = card
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(deck.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showCreateCard = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationDestination(isPresented: $navigateToBrowse) {
            BrowseView(deck: deck)
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
                if let env { try? env.cards.delete(card) }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This cannot be undone.")
        }
    }
}
