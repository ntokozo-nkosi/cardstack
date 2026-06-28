import SwiftData
import SwiftUI

struct DeckListView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Deck.createdAt, order: .forward) private var decks: [Deck]

    @State private var showCreateSheet = false
    @State private var pendingDelete: Deck?
    @State private var viewTarget: Deck?
    @State private var studyTarget: Deck?
    @State private var isMutating = false

    private let columns = [
        GridItem(.adaptive(minimum: 280, maximum: 380), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("My Decks")
                    .font(.largeTitle.weight(.bold))
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                Text("Manage your flashcard collections and study progress")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 16)

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
                    .padding(.top, 4)
                }
            }
            .padding(.bottom, 32)
            .fontDesign(.monospaced)
        }
        .refreshable {
            if let env {
                await BackendDeckSync.sync(apiClient: env.apiClient, context: modelContext)
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
            .accessibilityLabel("New Deck")
        }
        .navigationDestination(item: $viewTarget) { deck in
            DeckDetailView(deck: deck)
        }
        .navigationDestination(item: $studyTarget) { deck in
            StudyView(deck: deck)
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
                pendingDelete = nil
                guard let env else { return }
                Task {
                    isMutating = true
                    try? await env.decks.delete(deck)
                    isMutating = false
                }
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { _ in
            Text("This removes all its cards. This cannot be undone.")
        }
        .overlay { MutationOverlay(isShowing: isMutating) }
    }
}

struct MutationOverlay: View {
    let isShowing: Bool

    var body: some View {
        if isShowing {
            ZStack {
                Color.black.opacity(0.15)
                ProgressView()
                    .controlSize(.large)
                    .tint(Color("BrandPrimary"))
                    .padding(24)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
            .ignoresSafeArea()
            .transition(.opacity)
            .allowsHitTesting(true)
        }
    }
}
