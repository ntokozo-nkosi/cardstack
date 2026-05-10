import SwiftUI

struct CollectionEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    let editing: DeckCollection?

    @State private var name: String = ""
    @State private var detail: String = ""

    private var isEditing: Bool { editing != nil }
    private var isValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Spanish 101", text: $name)
                }
                Section("Description (optional)") {
                    TextField("What's this collection about?", text: $detail, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle(isEditing ? "Edit Collection" : "New Collection")
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
                    name = editing.name
                    detail = editing.detail ?? ""
                }
            }
        }
    }

    private func save() {
        guard let env else { return }
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedDetail = detail.trimmingCharacters(in: .whitespaces)
        let detailOrNil = trimmedDetail.isEmpty ? nil : trimmedDetail

        do {
            if let editing {
                try env.collections.update(editing, name: trimmedName, detail: detailOrNil)
            } else {
                _ = try env.collections.create(name: trimmedName, detail: detailOrNil)
            }
            dismiss()
        } catch {
            print("Failed to save collection: \(error)")
        }
    }
}
