import SwiftUI

struct RootView: View {
    @State private var selection: Int = 1

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                CollectionListView()
            }
            .tabItem {
                Label("Collections", systemImage: "square.stack.3d.up")
            }
            .tag(0)

            NavigationStack {
                DeckListView()
            }
            .tabItem {
                Label("Decks", systemImage: "rectangle.stack")
            }
            .tag(1)

            NavigationStack {
                CardListView()
            }
            .tabItem {
                Label("Cards", systemImage: "square.on.square")
            }
            .tag(2)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
            .tag(3)
        }
    }
}
