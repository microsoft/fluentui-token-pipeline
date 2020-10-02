import Color from "tinycolor2"
import FluentUIAliases from "./fluentui-aliases"
import * as Utils from "./utils"
import { Token, TokenSet, ComputedToken, ValueToken } from "./types"

/// Resolves all of the computed tokens in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolveComputedTokens = (properties: TokenSet): TokenSet =>
{
	// Look through the whole tree for "computed" nodes, and resolve each one.
	Utils.forEachRecursive(
		properties,
		prop => resolveComputed(prop as ComputedToken, properties),
		{ requiredChild: "computed" }
	)

	// Then, we just return the same object that was passed in, but modified.
	return properties
}

/// Resolve a single computed property, replacing the computation with a value.
const resolveComputed = (prop: ComputedToken, properties: TokenSet) =>
{
	// First, verify that this is indeed a computed token.
	if (typeof prop !== "object" || !("computed" in prop))
		throw new Error("Method was called on a property that wasn't a computed token.")
	if (typeof prop.computed !== "object")
	{
		console.error(`ERROR: Invalid computed: ${JSON.stringify(prop.computed)}. The computed property should be an object describing a valid token computation.`);
		(prop as unknown as ValueToken).value = "<ERROR: Invalid computed syntax>"
		return null
	}

	// You can't use computed and value at the same time.
	if ("value" in prop)
	{
		console.error(`ERROR: computed: ${JSON.stringify((prop as any).computed)} was used along with value ${JSON.stringify((prop as any).value)}, so the computation was ignored.`)
	}

	// Now, verify that it's a supported type of computation, and if so, resolve it.
	if (isColorComputation(prop))
	{
		resolveColorComputation(prop, properties)
		return
	}

	// If we got this far, it wasn't a supported computation.
	console.error(`ERROR: Invalid computed: ${JSON.stringify(prop.computed)}. Unable to determine what type of computation to perform.`);
	(prop as unknown as ValueToken).value = "<ERROR: Unknown computation type>"
	return null
}

const isColorComputation = (prop: ComputedToken): boolean =>
{
	return "color" in prop.computed && "opacity" in prop.computed
}

const resolveColorComputation = (prop: ComputedToken, properties: TokenSet): ValueToken | null =>
{
	// First, validate the inputs.
	const originalColorToken = FluentUIAliases.findPropByPath(prop.computed.color, properties)
	if (!originalColorToken)
	{
		console.error(`ERROR: Couldn't find the token "${prop.computed.color}" used in a computed property.`);
		(prop as unknown as ValueToken).value = "<ERROR: Missing input token>"
		return null
	}

	const originalColorString = originalColorToken.value
	if (!originalColorString)
	{
		console.error(`ERROR: The token "${prop.computed.color}" used in a computed property didn't have a value.`);
		(prop as unknown as ValueToken).value = "<ERROR: Missing input token value>"
		return null
	}
	const originalColor = new Color(originalColorString)

	const newOpacity = parseFloat((prop.computed as any).opacity)
	if (isNaN(newOpacity))
	{
		console.error(`ERROR: Invalid opacity value ${JSON.stringify(newOpacity)} used in a computed property.`);
		(prop as unknown as ValueToken).value = "<ERROR: invalid opacity>"
		return null
	}

	// Hooray, looks like it's all valid. Compute a value for this token.
	const newColor = originalColor.clone()
	newColor.setAlpha(newOpacity)
	const propAsAny = prop as any
	delete propAsAny.computed
	propAsAny.value = newColor.toRgbString()
	propAsAny.wasComputed = true
	return propAsAny
}
