import Color from "tinycolor2"
import { TokenSet, Token, TokenGenerationProperties } from "./types"
import * as Utils from "./utils"

/// Creates all of the generated token sets in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolveGeneratedSets = (properties: TokenSet): TokenSet =>
{
	Utils.forEachRecursive(properties, prop => resolveGenerated(prop), { requiredChild: "generate" })

	// Then, we just return the same object that was passed in, but modified.
	return properties
}

const resolveGenerated = (prop: Token | TokenSet): void =>
{
	// First, verify that this is indeed a token set generation.
	if (typeof prop !== "object" || !("generate" in prop))
		throw new Error("Method was called on a property that wasn't a token set generation.")
	const generationProperties = prop.generate as TokenGenerationProperties
	delete (prop as any).generate
	if (typeof generationProperties !== "object")
	{
		Utils.setErrorValue(prop, "Invalid token set generation syntax", `Invalid token set generation syntax: ${JSON.stringify(generationProperties)}. The generate property should be an object like this: "generate": { ... }.`)
		// TODO: Add syntax example here
		return
	}

	// TODO: Add some more validation, like platform overrides

	// NYI: just add some junk
	for (let i = 0; i <= 100; i += 2)
	{
		prop[i.toString()] = { value: "magenta" }
	}
	return
}
