import SwiftData
import SwiftUI

struct CollectionListView: View {
    @Environment(\.appEnvironment) private var env
    @Query(sort: \DeckCollection.createdAt, order: .reverse) private var collections: [DeckCollection]

    @State private var showCreateSheet = false
    @State private var editingCollection: DeckCollection?
    @State private var pendingDelete: DeckCollection?

    var body: some View {
        Group {
            if collections.isEmpty {
                EmptyStateView(
                    systemImage: "square.stack.3d.up",
                    title: "No collections yet",
                    message: "Collections let you group related decks. Tap + to create one."
                )
            } else {
                List {
                    ForEach(collections) { collection in
                        NavigationLink(value: collection) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(collection.name)
                                    .font(.headline)
                                if let detail = collection.detail, !detail.isEmpty {
                                    Text(detail)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }
                                Text("\(collection.decks.count) \(collection.decks.count == 1 ? "deck" : "decks")")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(.vertical, 4)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                pendingDelete = collection
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button {
                                editingCollection = collection
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                    }
                }
            }
        }
        .navigationTitle("Collections")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationDestination(for: DeckCollection.self) { collection in
            CollectionDetailView(collection: collection)
        }
        .sheet(isPresented: $showCreateSheet) {
            CollectionEditorSheet(editing: nil)
        }
        .sheet(item: $editingCollection) { collection in
            CollectionEditorSheet(editing: collection)
        }
        .alert(
            "Delete collection?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            presenting: pendingDelete
        ) { collection in
            Button("Delete", role: .destructive) {
                if let env { try? env.collections.delete(collection) }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This will also delete every deck and card inside. This cannot be undone.")
        }
    }
}
