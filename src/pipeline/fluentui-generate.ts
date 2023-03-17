import Color from "tinycolor2"
import { TokenSet, Token, TokenGenerationProperties, TokenGenerationTypes, ValueToken } from "./types"
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
		Utils.setErrorValue(prop, "Invalid token set generation syntax", `Invalid token set generation syntax: ${JSON.stringify(generationProperties)}. The generate property should be an object like this: "generate": { "type": "lightness2to98by2", "value": "#0000ff" }.`)
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
		case "lightness2to98by2":
			return createLightness2to98by2Ramp(prop, value)
		case "fluentsharedcolors":
			return createSharedColorRamp(prop, value)
		case "alpha5to90":
			return createAlpha5to90Ramp(prop, value)

		default:
			throw new Error(`Unknown token set generation type in TokenGenerationTypes: ${JSON.stringify(type)}`)
	}
}

const createLightness2to98by2Ramp = (prop: TokenSet, value: string): void =>
{
	const hsl = new Color(value).toHsl()

	for (let i = 2; i <= 98; i += 2)
		prop[i.toString()] = { value: Color.fromRatio({ ...hsl, l: i / 100 }).toHexString() }
}

const createSharedColorRamp = (prop: TokenSet, value: string): void =>
{
	const baseColor = new Color(value)
	const lum = baseColor.getLuminance()
	const hsv = baseColor.toHsv()

	const updated = prop as any
	if (lum > 0)
	{
		updated.Shade50 = darken(hsv, .84)
		updated.Shade40 = darken(hsv, .7)
		updated.Shade30 = darken(hsv, .44)
		updated.Shade20 = darken(hsv, .24)
		updated.Shade10 = darken(hsv, .1)
	}
	updated.Primary = { value: baseColor.toHexString() }
	if (lum < 1)
	{
		updated.Tint10 = lighten(hsv, .12)
		updated.Tint20 = lighten(hsv, .24)
		updated.Tint30 = lighten(hsv, .4)
		updated.Tint40 = lighten(hsv, .7)
		updated.Tint50 = lighten(hsv, .84)
		updated.Tint60 = lighten(hsv, .96)
	}
}

const lighten = (color: Color.ColorFormats.HSVA, factor: number): ValueToken =>
{
	return { value: Color.fromRatio({
		h: color.h,
		s: clamp(color.s * (1 - factor)),
		v: clamp(color.v + (1 - color.v) * factor),
		a: color.a,
	}).toHexString() }
}

const darken = (color: Color.ColorFormats.HSVA, factor: number): ValueToken =>
{
	return { value: Color.fromRatio({
		h: color.h,
		s: color.s,
		v: clamp(color.v * (1 - factor)),
		a: color.a,
	}).toHexString() }
}

const clamp = (value: number): number =>
{
	return value < 0 ? 0 : value > 1 ? 1 : value
}

const createAlpha5to90Ramp = (prop: TokenSet, value: string): void =>
{
	const alphas = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90]
	const rgba = new Color(value)

	for (const alpha of alphas)
	{
		rgba.setAlpha(alpha / 100)
		prop[alpha] = { value: rgba.toRgbString() }
	}
}
