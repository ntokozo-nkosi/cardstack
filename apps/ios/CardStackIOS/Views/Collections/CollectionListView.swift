import SwiftData
import SwiftUI

struct CollectionListView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \DeckCollection.createdAt, order: .forward) private var collections: [DeckCollection]

    @State private var showCreateSheet = false
    @State private var editingCollection: DeckCollection?
    @State private var pendingDelete: DeckCollection?
    @State private var isMutating = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Collections")
                    .font(.largeTitle.weight(.bold))
                Text("Group your decks into related collections")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .fontDesign(.monospaced)

            if collections.isEmpty {
                EmptyStateView(
                    systemImage: "square.stack.3d.up",
                    title: "No collections yet",
                    message: "Collections let you group related decks. Tap + to create one."
                )
                .fontDesign(.monospaced)
            } else {
                List {
                    ForEach(collections) { collection in
                        NavigationLink(value: collection) {
                            VStack(alignment: .leading, spacing: 6) {
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
                .listStyle(.plain)
                .fontDesign(.monospaced)
                .refreshable {
                    if let env {
                        await BackendDeckSync.sync(apiClient: env.apiClient, context: modelContext)
                    }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .bottomTrailing) {
            Button {
                showCreateSheet = true
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
            .accessibilityLabel("New Collection")
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
                pendingDelete = nil
                guard let env else { return }
                Task {
                    isMutating = true
                    try? await env.collections.delete(collection)
                    isMutating = false
                }
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("Decks inside will be unassigned, not deleted. This cannot be undone.")
        }
        .overlay { MutationOverlay(isShowing: isMutating) }
    }
}
