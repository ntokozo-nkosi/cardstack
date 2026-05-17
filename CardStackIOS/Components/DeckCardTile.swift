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
                        .font(.title3.weight(.bold))
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if let detail = deck.detail, !detail.isEmpty {
                        Text(detail)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Text("No description provided.")
                            .font(.callout)
                            .italic()
                            .foregroundStyle(.tertiary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Spacer(minLength: 8)
                }
                .padding(18)
                .frame(maxWidth: .infinity, minHeight: 140, alignment: .topLeading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Divider()

            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    Text("\(dueCount)")
                        .font(.footnote.weight(.semibold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
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
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button(action: onView) {
                    Text("View")
                        .font(.footnote.weight(.medium))
                }
                .buttonStyle(.bordered)
                .controlSize(.regular)

                if dueCount > 0 {
                    Button(action: onStudy) {
                        Label("Study", systemImage: "play.fill")
                            .font(.footnote.weight(.semibold))
                            .labelStyle(.titleAndIcon)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.regular)
                }
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
                .strokeBorder(Color(.systemGray4), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        .contextMenu {
            Button("Delete Deck", systemImage: "trash", role: .destructive, action: onDelete)
        }
        .accessibilityAction(named: Text("Delete Deck")) {
            onDelete()
        }
    }
}
