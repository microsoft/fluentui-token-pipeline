import Color from "tinycolor2"
import { TokenSet, Token, TokenGenerationProperties, TokenGenerationTypes } from "./types"
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
		Utils.setErrorValue(prop, "Invalid token set generation syntax", `Invalid token set generation syntax: ${JSON.stringify(generationProperties)}. The generate property should be an object like this: "generate": { "type": "lightness0to100by2", "value": "#0000ff" }.`)
		return
	}

	// Validate the generation properties before continuing.
	if (!("type" in generationProperties) || !(generationProperties.type in TokenGenerationTypes))
	{
		Utils.setErrorValue(prop, "Invalid token set generation type", `Invalid token set generation type: ${JSON.stringify(generationProperties.type)}`)
		return
	}
	if (!("value" in generationProperties) || typeof generationProperties.value !== "string" || "aliasOf" in generationProperties)
	{
		Utils.setErrorValue(prop, "Invalid token set generation source value", `Invalid token set generation source value: ${JSON.stringify(generationProperties.value)}. Only raw values are supported, not aliases.`)
		return
	}

	// Okay, now call out to other functions based on the generation type.
	const { type, value } = generationProperties
	delete (generationProperties as any).type
	delete (generationProperties as any).value
	switch (type)
	{
		case "lightness0to100by2":
			return createLightness0to100by2Ramp(prop, value)
		default:
			throw new Error(`Unknown token set generation type in TokenGenerationTypes: ${JSON.stringify(type)}`)
	}
}

const createLightness0to100by2Ramp = (prop: TokenSet, value: string): void =>
{
	const hsl = new Color(value).toHsl()

	for (let i = 0; i <= 100; i += 2)
		prop[i.toString()] = { value: Color.fromRatio({ ...hsl, l: i / 100 }).toHexString() }
}
