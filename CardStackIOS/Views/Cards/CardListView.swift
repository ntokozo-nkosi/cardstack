import SwiftData
import SwiftUI

struct CardListView: View {
    @Query(sort: [SortDescriptor(\Card.createdAt, order: .reverse)]) private var allCards: [Card]

    private var groupedByDeck: [(deck: Deck?, cards: [Card])] {
        let groups = Dictionary(grouping: allCards) { $0.deck }
        return groups
            .sorted { lhs, rhs in
                (lhs.key?.name ?? "") < (rhs.key?.name ?? "")
            }
            .map { ($0.key, $0.value.sorted { $0.order < $1.order }) }
    }

    @State private var editingCard: Card?

    var body: some View {
        Group {
            if allCards.isEmpty {
                EmptyStateView(
                    systemImage: "square.on.square",
                    title: "No cards yet",
                    message: "Create a deck and add cards to see them all here."
                )
            } else {
                List {
                    ForEach(groupedByDeck, id: \.deck?.id) { group in
                        Section(group.deck?.name ?? "Unassigned") {
                            ForEach(group.cards) { card in
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
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("All Cards")
        .sheet(item: $editingCard) { card in
            if let deck = card.deck {
                CardEditorSheet(deck: deck, editing: card)
            }
        }
    }
}
