import Foundation

enum ClerkConfig {
    static var publishableKey: String {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "ClerkPublishableKey") as? String else {
            fatalError("Missing Clerk publishable key. Run Doppler setup and generate CardStackIOS/Config/Secrets.xcconfig.")
        }

        guard !key.isEmpty,
              key.hasPrefix("pk_"),
              !key.contains("REPLACE_ME"),
              !key.contains("YOUR_KEY")
        else {
            fatalError("Missing or placeholder Clerk publishable key. Run Doppler setup and generate CardStackIOS/Config/Secrets.xcconfig.")
        }
        return key
    }
}
