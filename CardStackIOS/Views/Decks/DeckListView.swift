import SwiftData
import SwiftUI

struct DeckListView: View {
    @Environment(\.appEnvironment) private var env
    @Query(sort: \Deck.createdAt, order: .forward) private var decks: [Deck]

    @State private var showCreateSheet = false
    @State private var pendingDelete: Deck?
    @State private var viewTarget: Deck?
    @State private var studyTarget: Deck?

    private let columns = [
        GridItem(.adaptive(minimum: 280, maximum: 380), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Manage your flashcard collections and study progress")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.top, 4)

                if decks.isEmpty {
                    EmptyStateView(
                        systemImage: "rectangle.stack",
                        title: "No decks yet",
                        message: "Create your first deck to start adding flashcards and mastering new topics."
                    )
                    .frame(minHeight: 360)
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(decks) { deck in
                            DeckCardTile(
                                deck: deck,
                                onView: { viewTarget = deck },
                                onStudy: { studyTarget = deck },
                                onDelete: { pendingDelete = deck }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 32)
        }
        .navigationTitle("My Decks")
        .fontDesign(.monospaced)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                            .font(.subheadline.weight(.bold))
                        Text("New Deck")
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Color("BrandPrimary"), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .navigationDestination(item: $viewTarget) { deck in
            DeckDetailView(deck: deck)
        }
        .navigationDestination(item: $studyTarget) { deck in
            BrowseView(deck: deck)
        }
        .sheet(isPresented: $showCreateSheet) {
            DeckEditorSheet(editing: nil, defaultCollection: nil)
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
