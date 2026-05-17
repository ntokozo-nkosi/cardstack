import SwiftUI

struct CardEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    let deck: Deck
    let editing: Card?

    @State private var front: String = ""
    @State private var back: String = ""
    @FocusState private var focusedField: Field?

    private enum Field { case front, back }

    private let maxLength = 200
    private var isEditing: Bool { editing != nil }
    private var isValid: Bool {
        !front.trimmingCharacters(in: .whitespaces).isEmpty &&
        !back.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    fieldSection(
                        label: "FRONT",
                        text: $front,
                        placeholder: "What is the AWS recommended VisibilityTimeout?",
                        field: .front
                    )

                    fieldSection(
                        label: "BACK",
                        text: $back,
                        placeholder: "Set VisibilityTimeout to at least 6× the Lambda timeout…",
                        field: .back
                    )
                }
                .padding(20)
            }

            saveBar
        }
        .background(Color(.systemBackground))
        .fontDesign(.monospaced)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear {
            if let editing {
                front = editing.front
                back = editing.back
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                focusedField = .front
            }
        }
    }

    private var header: some View {
        ZStack {
            Text(isEditing ? "Edit Card" : "New Card")
                .font(.headline)

            HStack {
                Button("Cancel") { dismiss() }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 26)
        .padding(.bottom, 18)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color(.separator).opacity(0.5))
                .frame(height: 0.5)
        }
    }

    @ViewBuilder
    private func fieldSection(
        label: String,
        text: Binding<String>,
        placeholder: String,
        field: Field
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .tracking(1.5)
                Spacer()
                Text("\(text.wrappedValue.count)/\(maxLength)")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(text.wrappedValue.count >= maxLength ? Color("BrandPrimary") : Color(.tertiaryLabel))
            }

            TextField(placeholder, text: text, axis: .vertical)
                .font(.callout)
                .lineLimit(4...10)
                .focused($focusedField, equals: field)
                .padding(14)
                .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(
                            focusedField == field ? Color("BrandPrimary") : Color(.separator),
                            lineWidth: focusedField == field ? 1.5 : 1
                        )
                )
                .animation(.easeInOut(duration: 0.15), value: focusedField)
                .onChange(of: text.wrappedValue) { _, newValue in
                    if newValue.count > maxLength {
                        text.wrappedValue = String(newValue.prefix(maxLength))
                    }
                }
        }
    }

    private var saveBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color(.separator).opacity(0.5))
                .frame(height: 0.5)

            Button {
                save()
            } label: {
                Text(isEditing ? "Save Card" : "Create Card")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color("BrandPrimary"), in: Capsule())
                    .opacity(isValid ? 1 : 0.45)
            }
            .buttonStyle(.plain)
            .disabled(!isValid)
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 28)
        }
    }

    private func save() {
        guard let env else { return }
        let f = front.trimmingCharacters(in: .whitespaces)
        let b = back.trimmingCharacters(in: .whitespaces)
        do {
            if let editing {
                try env.cards.update(editing, front: f, back: b)
            } else {
                _ = try env.cards.create(front: f, back: b, in: deck)
            }
            dismiss()
        } catch {
            print("Failed to save card: \(error)")
        }
    }
}
