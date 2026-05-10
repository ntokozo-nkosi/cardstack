import SwiftData
import SwiftUI

struct DeckListView: View {
    @Environment(\.appEnvironment) private var env
    @Query(sort: \Deck.createdAt, order: .reverse) private var decks: [Deck]

    @State private var showCreateSheet = false
    @State private var editingDeck: Deck?
    @State private var pendingDelete: Deck?
    @State private var browseTarget: Deck?

    private let columns = [
        GridItem(.adaptive(minimum: 160, maximum: 240), spacing: 12)
    ]

    var body: some View {
        Group {
            if decks.isEmpty {
                EmptyStateView(
                    systemImage: "rectangle.stack",
                    title: "No decks yet",
                    message: "Decks hold your flashcards. Tap + to create your first one."
                )
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(decks) { deck in
                            NavigationLink(value: deck) {
                                DeckCardTile(
                                    deck: deck,
                                    onBrowse: { browseTarget = deck },
                                    onEdit: { editingDeck = deck },
                                    onDelete: { pendingDelete = deck }
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("Decks")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationDestination(for: Deck.self) { deck in
            DeckDetailView(deck: deck)
        }
        .navigationDestination(item: $browseTarget) { deck in
            BrowseView(deck: deck)
        }
        .sheet(isPresented: $showCreateSheet) {
            DeckEditorSheet(editing: nil, defaultCollection: nil)
        }
        .sheet(item: $editingDeck) { deck in
            DeckEditorSheet(editing: deck, defaultCollection: nil)
        }
        .alert(
            "Delete deck?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            presenting: pendingDelete
        ) { deck in
            Button("Delete", role: .destructive) {
                if let env { try? env.decks.delete(deck) }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This removes all its cards. This cannot be undone.")
        }
    }
}
