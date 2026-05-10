import SwiftUI

struct FlashcardView: View {
    let front: String
    let back: String
    @Binding var flipped: Bool

    var body: some View {
        ZStack {
            face(text: front, label: "Front", hint: "Tap to flip")
                .opacity(flipped ? 0 : 1)
            face(text: back, label: "Back", hint: "Tap to flip back")
                .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                .opacity(flipped ? 1 : 0)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 320)
        .rotation3DEffect(
            .degrees(flipped ? 180 : 0),
            axis: (x: 0, y: 1, z: 0)
        )
        .animation(.spring(response: 0.6, dampingFraction: 0.7), value: flipped)
        .contentShape(Rectangle())
        .onTapGesture {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            flipped.toggle()
        }
    }

    @ViewBuilder
    private func face(text: String, label: String, hint: String) -> some View {
        VStack(spacing: 16) {
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .tracking(1)

            Spacer()

            Text(text)
                .font(.title2)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            Text(hint)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.regularMaterial, in: .rect(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(.separator, lineWidth: 0.5)
        )
    }
}
