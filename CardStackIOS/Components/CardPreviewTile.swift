import SwiftUI

struct CardPreviewTile: View {
    let card: Card
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 10) {
                Text("FRONT")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.tertiary)
                    .tracking(1.5)

                Text(card.front)
                    .font(.callout)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .background(Color(.systemBackground), in: .rect(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Color(.separator).opacity(0.5), lineWidth: 0.5)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button("Delete", systemImage: "trash", role: .destructive, action: onDelete)
        }
    }
}
