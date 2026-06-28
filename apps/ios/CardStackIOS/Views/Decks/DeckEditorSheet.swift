import SwiftData
import SwiftUI

struct DeckEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    @Query(sort: \DeckCollection.createdAt, order: .forward) private var allCollections: [DeckCollection]

    let editing: Deck?
    let defaultCollection: DeckCollection?

    @State private var name: String = ""
    @State private var detail: String = ""
    @State private var collectionId: UUID? = nil
    @State private var isSaving = false
    @State private var errorMessage: String?
    @FocusState private var focusedField: Field?

    private enum Field { case name, detail }

    private var isEditing: Bool { editing != nil }
    private var isValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }
    private var selectedCollection: DeckCollection? {
        allCollections.first { $0.id == collectionId }
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    fieldSection(label: "NAME", field: .name) {
                        TextField("e.g. EC2 Bootstrapping", text: $name)
                            .font(.callout)
                            .focused($focusedField, equals: .name)
                            .padding(14)
                            .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                            .overlay(borderOverlay(for: .name))
                    }

                    fieldSection(label: "DESCRIPTION", field: .detail) {
                        TextField("What's this deck about?", text: $detail, axis: .vertical)
                            .font(.callout)
                            .lineLimit(3...6)
                            .focused($focusedField, equals: .detail)
                            .padding(14)
                            .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                            .overlay(borderOverlay(for: .detail))
                    }

                    collectionPicker
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
                name = editing.name
                detail = editing.detail ?? ""
                collectionId = editing.collections.first?.id
            } else if let defaultCollection {
                collectionId = defaultCollection.id
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                focusedField = .name
            }
        }
        .alert(
            "Couldn't save deck",
            isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            ),
            presenting: errorMessage
        ) { _ in
            Button("OK") { errorMessage = nil }
        } message: { message in
            Text(message)
        }
    }

    private var header: some View {
        ZStack {
            Text(isEditing ? "Edit Deck" : "New Deck")
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
    private func fieldSection<Content: View>(
        label: String,
        field: Field,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .tracking(1.5)
            content()
        }
    }

    private func borderOverlay(for field: Field) -> some View {
        RoundedRectangle(cornerRadius: 10)
            .strokeBorder(
                focusedField == field ? Color("BrandPrimary") : Color(.separator),
                lineWidth: focusedField == field ? 1.5 : 1
            )
            .animation(.easeInOut(duration: 0.15), value: focusedField)
    }

    private var collectionPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("COLLECTION")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .tracking(1.5)

            Menu {
                Button("None") { collectionId = nil }
                ForEach(allCollections) { collection in
                    Button(collection.name) { collectionId = collection.id }
                }
            } label: {
                HStack {
                    Text(selectedCollection?.name ?? "None")
                        .font(.callout)
                        .foregroundStyle(.primary)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                .padding(14)
                .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color(.separator), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var saveBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color(.separator).opacity(0.5))
                .frame(height: 0.5)

            Button {
                Task { await save() }
            } label: {
                ZStack {
                    Text(isEditing ? "Save Deck" : "Create Deck")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .opacity(isSaving ? 0 : 1)
                    if isSaving {
                        ProgressView()
                            .tint(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color("BrandPrimary"), in: Capsule())
                .opacity(isValid && !isSaving ? 1 : 0.45)
            }
            .buttonStyle(.plain)
            .disabled(!isValid || isSaving)
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 28)
        }
    }

    private func save() async {
        guard let env else { return }
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedDetail = detail.trimmingCharacters(in: .whitespaces)
        let detailOrNil = trimmedDetail.isEmpty ? nil : trimmedDetail

        isSaving = true
        defer { isSaving = false }

        do {
            if let editing {
                try await env.decks.update(editing, name: trimmedName, detail: detailOrNil)
            } else {
                let created = try await env.decks.create(name: trimmedName, detail: detailOrNil)
                if let collection = selectedCollection {
                    try await env.collections.add(deck: created, to: collection)
                }
            }
            dismiss()
        } catch {
            errorMessage = "Failed to save deck: \(error.localizedDescription)"
        }
    }
}
