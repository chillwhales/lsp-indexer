/**
 * Subscription utilities for `@lsp-indexer/node`.
 *
 * Since subscription state is now managed entirely within SubscriptionClient
 * implementations, this file mainly serves as documentation of the pattern.
 *
 * The flow is:
 * 1. Domain functions (like createProfilesSubscription) return SubscriptionConfig
 * 2. Hooks call client.createSubscription(config, options)
 * 3. Client returns SubscriptionInstance with built-in state management
 * 4. Hooks sync their React/Next state with the instance using subscribe()
 *
 * This keeps the architecture clean:
 * - Node: Domain configuration building (pure functions)
 * - Client: Subscription state management (stateful class)
 * - Hooks: Framework integration (React useState + useEffect)
 */

// This file could export utility functions in the future, but for now
// the main pattern is that clients handle everything and node just
// provides domain configuration builders.
