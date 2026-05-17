import UIKit

/// Single-screen guard for blocking the navigation pop (back button + edge swipe).
/// A view that wants to intercept pops sets `shouldAllowPop` on appear and clears it on disappear.
/// When the user attempts to swipe back and `shouldAllowPop()` returns false, the swipe is cancelled
/// and `onBlockedPop` is invoked so the view can show its own confirmation alert.
final class NavigationPopGuard {
    static let shared = NavigationPopGuard()
    private init() {}

    var shouldAllowPop: (() -> Bool)?
    var onBlockedPop: (() -> Void)?
}

extension UINavigationController: @retroactive UIGestureRecognizerDelegate {
    override open func viewDidLoad() {
        super.viewDidLoad()
        interactivePopGestureRecognizer?.delegate = self
    }

    public func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard viewControllers.count > 1 else { return false }
        if let shouldAllow = NavigationPopGuard.shared.shouldAllowPop, !shouldAllow() {
            NavigationPopGuard.shared.onBlockedPop?()
            return false
        }
        return true
    }
}
