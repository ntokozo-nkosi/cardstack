import SwiftData
import SwiftUI

struct DeckEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    @Query(sort: \DeckCollection.createdAt, order: .reverse) private var allCollections: [DeckCollection]

    let editing: Deck?
    let defaultCollection: DeckCollection?

    @State private var name: String = ""
    @State private var detail: String = ""
    @State private var collectionId: UUID? = nil

    private var isEditing: Bool { editing != nil }
    private var isValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Greetings", text: $name)
                }
                Section("Description (optional)") {
                    TextField("What's this deck about?", text: $detail, axis: .vertical)
                        .lineLimit(3...6)
                }
                Section("Collection") {
                    Picker("Collection", selection: $collectionId) {
                        Text("None").tag(UUID?.none)
                        ForEach(allCollections) { collection in
                            Text(collection.name).tag(Optional(collection.id))
                        }
                    }
                    .pickerStyle(.navigationLink)
                }
            }
            .navigationTitle(isEditing ? "Edit Deck" : "New Deck")
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
                    collectionId = editing.collection?.id
                } else if let defaultCollection {
                    collectionId = defaultCollection.id
                }
            }
        }
    }

    private func save() {
        guard let env else { return }
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedDetail = detail.trimmingCharacters(in: .whitespaces)
        let detailOrNil = trimmedDetail.isEmpty ? nil : trimmedDetail
        let selectedCollection = allCollections.first { $0.id == collectionId }

        do {
            if let editing {
                try env.decks.update(
                    editing,
                    name: trimmedName,
                    detail: detailOrNil,
                    collection: selectedCollection
                )
            } else {
                _ = try env.decks.create(
                    name: trimmedName,
                    detail: detailOrNil,
                    in: selectedCollection
                )
            }
            dismiss()
        } catch {
            print("Failed to save deck: \(error)")
        }
    }
}
