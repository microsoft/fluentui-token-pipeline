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
		case "fluentsharedcolors":
			return createSharedColorRamp(prop, value)
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

const createSharedColorRamp = (prop: TokenSet, value: string): void =>
{
	const baseColor = new Color(value)
	const lum = baseColor.getLuminance()
	const hsv = baseColor.toHsv()

	const updated = prop as any
	updated.Primary = { value: baseColor.toHexString() }

	// The specific algorithm to use depends on the lightness of the source color.
	if (lum >= 1)
	{
		// White
		// REVIEW: These don't make any sense; they won't make a uniform ramp!
		updated.Shade50 = darken(hsv, .349)
		updated.Shade40 = darken(hsv, .216)
		updated.Shade30 = darken(hsv, .027)
		updated.Shade20 = darken(hsv, .043)
		updated.Shade10 = darken(hsv, .082)
		updated.Tint10 = darken(hsv, .145)
		updated.Tint20 = darken(hsv, .043)
		updated.Tint30 = darken(hsv, .184)
		updated.Tint40 = darken(hsv, .216)
		updated.Tint50 = darken(hsv, .349)
		updated.Tint60 = darken(hsv, .537)
		// WhiteShadeTable = [0.537, 0.349, 0.216, 0.184, 0.145, 0.082, 0.043, 0.027];
	}
	else if (lum <= 0)
	{
		// Black
		// REVIEW: These don't make any sense; they won't make a uniform ramp!
		updated.Shade50 = lighten(hsv, .45)
		updated.Shade40 = lighten(hsv, .349)
		updated.Shade30 = lighten(hsv, .048)
		updated.Shade20 = lighten(hsv, .082)
		updated.Shade10 = lighten(hsv, .145)
		updated.Tint10 = lighten(hsv, .184)
		updated.Tint20 = lighten(hsv, .082)
		updated.Tint30 = lighten(hsv, .216)
		updated.Tint40 = lighten(hsv, .349)
		updated.Tint50 = lighten(hsv, .45)
		updated.Tint60 = lighten(hsv, .537)
		// BlackTintTable = [0.537, 0.45, 0.349, 0.216, 0.184, 0.145, 0.082, 0.043];
	}
	else if (lum > 0.80)
	{
		// Light color
		// REVIEW: This seems suspect at best
		updated.Shade50 = lighten(hsv, .22)
		updated.Shade40 = lighten(hsv, .33)
		updated.Shade30 = darken(hsv, .88)
		updated.Shade20 = darken(hsv, .77)
		updated.Shade10 = darken(hsv, .66)
		updated.Tint10 = darken(hsv, .55)
		updated.Tint20 = lighten(hsv, .77)
		updated.Tint30 = darken(hsv, .44)
		updated.Tint40 = darken(hsv, .33)
		updated.Tint50 = darken(hsv, .22)
		updated.Tint60 = darken(hsv, .11)
		// LumShadeTable = [0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88];
	}
	else if (lum < 0.20)
	{
		// Dark color
		// REVIEW: This seems suspect at best
		updated.Shade50 = darken(hsv, .77)
		updated.Shade40 = darken(hsv, .66)
		updated.Shade30 = lighten(hsv, .11)
		updated.Shade20 = lighten(hsv, .22)
		updated.Shade10 = lighten(hsv, .33)
		updated.Tint10 = lighten(hsv, .44)
		updated.Tint20 = darken(hsv, .22)
		updated.Tint30 = lighten(hsv, .55)
		updated.Tint40 = lighten(hsv, .66)
		updated.Tint50 = lighten(hsv, .77)
		updated.Tint60 = lighten(hsv, .88)
		// LumTintTable = [0.88, 0.77, 0.66, 0.55, 0.44, 0.33, 0.22, 0.11];
	}
	else
	{
		// Everything else
		updated.Shade50 = darken(hsv, .84)
		updated.Shade40 = darken(hsv, .7)
		updated.Shade30 = lighten(hsv, .44)
		updated.Shade20 = lighten(hsv, .24)
		updated.Shade10 = lighten(hsv, .1)
		updated.Tint10 = lighten(hsv, .12)
		updated.Tint20 = darken(hsv, .24)
		updated.Tint30 = lighten(hsv, .4)
		updated.Tint40 = lighten(hsv, .7)
		updated.Tint50 = lighten(hsv, .84)
		updated.Tint60 = lighten(hsv, .96)
		// ColorTintTable = [0.96, 0.84, 0.7, 0.4, 0.12]; and darken in dark
		// ColorShadeTable = [0.1, 0.24, 0.44]; and lighten in dark
	}
}

/*
	Fabric color generation: see the code here:
	https://github.com/microsoft/fluentui/blob/master/packages/react/src/utilities/color/shades.ts

	You'll want to reimplement that logic rather than pulling in all of the crazy React dependencies. The existing
	code is messy anyway.

	New palette	Fabric version
	Shade 50	Dark themeLighter (2) *  =>
	Shade 40	Dark themeLight (3)
	Shade 30	Light themeDarker (8)
	Shade 20	Light themeDark (7)
	Shade 10	Light themeDarkAlt (6)
	Primary (0)
	Tint 10			Light themeSecondary (5)
	Tint 20			Dark themeDark (7)
	Tint 30			Light themeTertiary (4)
	Tint 40			Light themeLight (3)
	Tint 50			Light themeLighter (2)
	Tint 60			Light themeLighterAlt (1)

	* Figma says Shade 50 is themeLighterAlt, but verified as themeLighter
*/

const lighten = (color: Color.ColorFormats.HSVA, factor: number): ValueToken =>
{
	return { value: Color.fromRatio({
		h: color.h,
		s: clamp(color.s * (1 - factor), 100, 0),
		v: clamp(color.v + (100 - color.v) * factor, 100, 0),
		a: color.a,
	}).toHexString() }
}

const darken = (color: Color.ColorFormats.HSVA, factor: number): ValueToken =>
{
	return { value: Color.fromRatio({
		h: color.h,
		s: color.s,
		v: clamp(color.v * (1 - factor), 100, 0),
		a: color.a,
	}).toHexString() }
}

const clamp = (value: number, max: number, min: number): number =>
{
	// REVIEW: What kind of psycho puts a "max" parameter before "min"?
	return value < min ? min : value > max ? max : value
}
