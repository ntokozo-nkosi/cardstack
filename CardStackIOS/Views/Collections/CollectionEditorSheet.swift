import SwiftUI

struct CollectionEditorSheet: View {
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    let editing: DeckCollection?

    @State private var name: String = ""
    @State private var detail: String = ""
    @FocusState private var focusedField: Field?

    private enum Field { case name, detail }

    private var isEditing: Bool { editing != nil }
    private var isValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    fieldSection(label: "NAME") {
                        TextField("e.g. AWS Solutions Architect", text: $name)
                            .font(.callout)
                            .focused($focusedField, equals: .name)
                            .padding(14)
                            .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                            .overlay(borderOverlay(for: .name))
                    }

                    fieldSection(label: "DESCRIPTION") {
                        TextField("What's this collection about?", text: $detail, axis: .vertical)
                            .font(.callout)
                            .lineLimit(3...6)
                            .focused($focusedField, equals: .detail)
                            .padding(14)
                            .background(Color(.systemBackground), in: .rect(cornerRadius: 10))
                            .overlay(borderOverlay(for: .detail))
                    }
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
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                focusedField = .name
            }
        }
    }

    private var header: some View {
        ZStack {
            Text(isEditing ? "Edit Collection" : "New Collection")
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
    private func fieldSection<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
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

    private var saveBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color(.separator).opacity(0.5))
                .frame(height: 0.5)

            Button {
                save()
            } label: {
                Text(isEditing ? "Save Collection" : "Create Collection")
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
