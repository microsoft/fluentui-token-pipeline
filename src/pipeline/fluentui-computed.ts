import Color from "tinycolor2"
import * as Utils from "./utils"
import { Token, TokenSet, ComputedToken, ValueToken } from "./types"

/// Resolves all of the computed tokens in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolveComputedTokens = (properties: TokenSet): TokenSet =>
{
	// Look through the whole tree for "computed" nodes, and resolve each one.
	Utils.forEachRecursive(properties, prop => resolveComputed(prop, properties), { requiredChild: "computed" })

	// Then, we just return the same object that was passed in, but modified.
	return properties
}

/// Resolve a single computed property, replacing the computation with a value.
const resolveComputed = (prop: TokenSet | Token, properties: TokenSet): void =>
{
	// First, verify that this is indeed a computed token.
	if (typeof prop !== "object" || !("computed" in prop))
		throw new Error("Method was called on a property that wasn't a computed token.")
	if (typeof prop.computed !== "object")
	{
		Utils.setErrorValue(prop, "Invalid computed syntax", `Invalid computed: ${JSON.stringify(prop.computed)}. The computed property should be an object describing a valid token computation.`)
		return
	}

	// You can't use computed and value at the same time.
	if ("value" in prop)
	{
		Utils.reportError(`computed: ${JSON.stringify((prop as any).computed)} was used along with value ${JSON.stringify((prop as any).value)}, so the computation was ignored.`)
		return
	}

	// Now, verify that it's a supported type of computation, and if so, resolve it.
	const token = prop as ComputedToken
	if (isColorComputation(token))
	{
		resolveColorComputation(token, properties)
		return
	}

	// If we got this far, it wasn't a supported computation.
	Utils.setErrorValue(prop, "Unknown computation type", `Invalid computed: ${JSON.stringify(prop.computed)}. Unable to determine what type of computation to perform.`)
}

const isColorComputation = (prop: ComputedToken): boolean =>
{
	return "color" in prop.computed && "opacity" in prop.computed
}

const resolveColorComputation = (prop: ComputedToken, properties: TokenSet): ValueToken | null =>
{
	// First, validate the inputs.
	const originalColorToken = Utils.findPropByPath(prop.computed.color, properties)
	if (!originalColorToken)
	{
		Utils.setErrorValue(prop, "Missing input token", `Couldn't find the token "${prop.computed.color}" used in a computed property.`)
		return null
	}

	const originalColorString = (originalColorToken as ValueToken).value
	if (!originalColorString || typeof originalColorString !== "string")
	{
		Utils.setErrorValue(prop, "Missing or invalid input token value", `The token "${prop.computed.color}" used in a computed property didn't have a string value.`)
		return null
	}
	const originalColor = new Color(originalColorString)

	const newOpacity = parseFloat((prop.computed as any).opacity)
	if (isNaN(newOpacity))
	{
		Utils.setErrorValue(prop, "Invalid opacity", `Invalid opacity value ${JSON.stringify(newOpacity)} used in a computed property.`)
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
