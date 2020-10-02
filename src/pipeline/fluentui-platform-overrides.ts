import * as Utils from "./utils"
import { Token, TokenSet, TokenPlatformOverrides, SupportedPlatform, TokenSetChildren } from "./types"

/// Applies all of the overrides in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolvePlatformOverrides = (properties: TokenSet, currentPlatform: SupportedPlatform): TokenSet =>
{
	Utils.forEachRecursive(properties, prop => resolvePlatformOverride(prop, currentPlatform), { requiredChild: "platform" })

	// Then, we just return the same object that was passed in, but modified.
	return properties
}

const supportedTokenPlatformOverrides = { "winui": true }

const resolvePlatformOverride = (prop: TokenSet | Token, currentPlatform: SupportedPlatform): void =>
{
	// First, verify that this is indeed a platform override node.
	if (typeof prop !== "object" || !("platform" in prop))
		throw new Error("Method was called on a property that wasn't a platform override node.")
	const overrides = prop.platform as TokenPlatformOverrides
	delete (prop as any).platform
	if (typeof overrides !== "object")
	{
		Utils.setErrorValue(prop, "Invalid platform override syntax", `Invalid platform override: ${JSON.stringify(prop.platform)}. The platform property should be an object like this: "platform": { "winui": { "property": "value" } }.`)
		return
	}

	// You can't use platform overrides and value at the same time.
	if ("value" in prop)
	{
		Utils.reportError(`A platform override was used along with value ${JSON.stringify((prop as any).value)}, so the platform override was ignored.`)
		return
	}

	// Now, make sure there aren't any unsupported platforms in the list.
	for (const overrideKey in overrides)
	{
		if (!supportedTokenPlatformOverrides[overrideKey])
		{
			Utils.reportError(`A platform override for unsupported platform ${overrideKey} was ignored.`)
			return
		}
	}

	// Now, if the current platform wasn't overridden, we're done.
	if (!(currentPlatform in overrides)) return

	// Otherwise, apply the override.
	const currentOverride = overrides[currentPlatform] as TokenSetChildren
	// TODO: apply the actual override
	console.log("TODO: Apply", currentOverride, "as an override to", prop)
}
