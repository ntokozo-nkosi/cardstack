import SwiftUI

struct CollectionDetailView: View {
    @Environment(\.appEnvironment) private var env
    let collection: DeckCollection

    @State private var showCreateDeck = false
    @State private var editingDeck: Deck?
    @State private var pendingDelete: Deck?

    private var sortedDecks: [Deck] {
        collection.decks.sorted { $0.createdAt > $1.createdAt }
    }

    var body: some View {
        List {
            if let detail = collection.detail, !detail.isEmpty {
                Section {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Decks") {
                if sortedDecks.isEmpty {
                    Text("No decks in this collection yet.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(sortedDecks) { deck in
                        NavigationLink(value: deck) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(deck.name).font(.headline)
                                Text("\(deck.cards.count) \(deck.cards.count == 1 ? "card" : "cards")")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                pendingDelete = deck
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button {
                                editingDeck = deck
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                    }
                }
            }
        }
        .navigationTitle(collection.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showCreateDeck = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationDestination(for: Deck.self) { deck in
            DeckDetailView(deck: deck)
        }
        .sheet(isPresented: $showCreateDeck) {
            DeckEditorSheet(editing: nil, defaultCollection: collection)
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
                if let env {
                    Task { try? await env.decks.delete(deck) }
                }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This removes all its cards. This cannot be undone.")
        }
    }
}
