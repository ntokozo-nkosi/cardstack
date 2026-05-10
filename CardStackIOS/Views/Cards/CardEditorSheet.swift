import SwiftUI

struct CardEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    let deck: Deck
    let editing: Card?

    @State private var front: String = ""
    @State private var back: String = ""

    private let maxLength = 200
    private var isEditing: Bool { editing != nil }
    private var isValid: Bool {
        !front.trimmingCharacters(in: .whitespaces).isEmpty &&
        !back.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Front", text: $front, axis: .vertical)
                        .lineLimit(3...8)
                        .onChange(of: front) { _, newValue in
                            if newValue.count > maxLength {
                                front = String(newValue.prefix(maxLength))
                            }
                        }
                } header: {
                    HStack {
                        Text("Front")
                        Spacer()
                        Text("\(front.count)/\(maxLength)")
                            .font(.caption)
                            .foregroundStyle(front.count >= maxLength ? .orange : .secondary)
                    }
                }

                Section {
                    TextField("Back", text: $back, axis: .vertical)
                        .lineLimit(3...8)
                        .onChange(of: back) { _, newValue in
                            if newValue.count > maxLength {
                                back = String(newValue.prefix(maxLength))
                            }
                        }
                } header: {
                    HStack {
                        Text("Back")
                        Spacer()
                        Text("\(back.count)/\(maxLength)")
                            .font(.caption)
                            .foregroundStyle(back.count >= maxLength ? .orange : .secondary)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Card" : "New Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Save" : "Create") { save() }
                        .disabled(!isValid)
                }
            }
            .onAppear {
                if let editing {
                    front = editing.front
                    back = editing.back
                }
            }
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
