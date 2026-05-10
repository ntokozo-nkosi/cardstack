import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                CollectionListView()
            }
            .tabItem {
                Label("Collections", systemImage: "square.stack.3d.up")
            }

            NavigationStack {
                DeckListView()
            }
            .tabItem {
                Label("Decks", systemImage: "rectangle.stack")
            }

            NavigationStack {
                CardListView()
            }
            .tabItem {
                Label("Cards", systemImage: "square.on.square")
            }
        }
    }
}
