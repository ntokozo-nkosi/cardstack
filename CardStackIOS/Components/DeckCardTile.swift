import SwiftUI

struct DeckCardTile: View {
    let deck: Deck
    let onView: () -> Void
    let onStudy: () -> Void
    let onDelete: () -> Void

    private var dueCount: Int { deck.cards.count }

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onView) {
                VStack(alignment: .leading, spacing: 12) {
                    Text(deck.name)
                        .font(.headline.weight(.semibold))
                        .lineLimit(1)
                        .truncationMode(.tail)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if let detail = deck.detail, !detail.isEmpty {
                        Text(detail)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Text("No description provided.")
                            .font(.subheadline)
                            .italic()
                            .foregroundStyle(.tertiary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Spacer(minLength: 8)
                }
                .padding(16)
                .frame(maxWidth: .infinity, minHeight: 140, alignment: .topLeading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Divider()

            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    Text("\(dueCount)")
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(Color("BrandPrimary").opacity(0.12))
                        )
                        .overlay(
                            Capsule()
                                .strokeBorder(Color("BrandPrimary").opacity(0.25), lineWidth: 0.5)
                        )
                        .foregroundStyle(Color("BrandPrimary"))

                    Text(dueCount == 1 ? "card due" : "cards due")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button(action: onView) {
                    Text("View")
                        .font(.caption.weight(.medium))
                }
                .buttonStyle(.bordered)
                .controlSize(.small)

                if dueCount > 0 {
                    Button(action: onStudy) {
                        Label("Study", systemImage: "play.fill")
                            .font(.caption.weight(.semibold))
                            .labelStyle(.titleAndIcon)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }

                Menu {
                    Button("Delete", systemImage: "trash", role: .destructive, action: onDelete)
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .frame(width: 28, height: 28)
                        .contentShape(Rectangle())
                }
                .menuStyle(.button)
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color(.separator).opacity(0.6), lineWidth: 0.5)
        )
    }
}
