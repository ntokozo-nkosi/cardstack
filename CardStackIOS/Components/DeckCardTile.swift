import SwiftUI

struct DeckCardTile: View {
    let deck: Deck
    let onBrowse: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                Text(deck.name)
                    .font(.headline)
                    .lineLimit(1)
                Spacer()
                Menu {
                    Button("Browse", systemImage: "play.fill", action: onBrowse)
                        .disabled(deck.cards.isEmpty)
                    Button("Edit", systemImage: "pencil", action: onEdit)
                    Button("Delete", systemImage: "trash", role: .destructive, action: onDelete)
                } label: {
                    Image(systemName: "ellipsis")
                        .foregroundStyle(.secondary)
                        .padding(8)
                        .contentShape(Rectangle())
                }
            }

            if let detail = deck.detail, !detail.isEmpty {
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            } else {
                Text("No description")
                    .font(.subheadline)
                    .foregroundStyle(.tertiary)
                    .italic()
            }

            Spacer(minLength: 8)

            HStack {
                Label("\(deck.cards.count)", systemImage: "rectangle.on.rectangle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if !deck.cards.isEmpty {
                    Button(action: onBrowse) {
                        Label("Browse", systemImage: "play.fill")
                            .font(.caption.weight(.semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(minHeight: 160)
        .background(.regularMaterial, in: .rect(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(.separator, lineWidth: 0.5)
        )
    }
}
