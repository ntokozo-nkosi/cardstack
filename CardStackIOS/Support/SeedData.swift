import Foundation

enum SeedData {
    private static let didSeedKey = "didSeed.v1"

    static func runIfNeeded(env: AppEnvironment) {
        #if DEBUG
        guard !UserDefaults.standard.bool(forKey: didSeedKey) else { return }

        do {
            let collection = try env.collections.create(
                name: "Spanish 101",
                detail: "Common phrases and verbs for beginners."
            )

            let greetings = try env.decks.create(
                name: "Greetings",
                detail: "Saying hello and goodbye.",
                in: collection
            )
            _ = try env.cards.create(front: "Hello", back: "Hola", in: greetings)
            _ = try env.cards.create(front: "Good morning", back: "Buenos días", in: greetings)
            _ = try env.cards.create(front: "Goodbye", back: "Adiós", in: greetings)

            let verbs = try env.decks.create(
                name: "Common Verbs",
                detail: "The most-used everyday verbs.",
                in: collection
            )
            _ = try env.cards.create(front: "to be (permanent)", back: "ser", in: verbs)
            _ = try env.cards.create(front: "to have", back: "tener", in: verbs)
            _ = try env.cards.create(front: "to go", back: "ir", in: verbs)

            UserDefaults.standard.set(true, forKey: didSeedKey)
        } catch {
            print("SeedData failed: \(error)")
        }
        #endif
    }
}
