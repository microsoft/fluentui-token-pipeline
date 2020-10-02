import * as Utils from "./utils"
import { Token, TokenSet } from "./types"

/// Applies all of the overrides in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolvePlatformOverrides = (properties: TokenSet): TokenSet =>
{
	const resolver = (prop: TokenSet | Token, key: string): void =>
	{
		// NYI
	}
	Utils.forEachRecursive(properties, resolver, { requiredChild: "platform" })

	// Then, we just return the same object that was passed in, but modified.
	return properties
}
