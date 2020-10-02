import Color from "tinycolor2"
import { TokenSet, Token } from "./types"

/**
	Replaces a Global.Color token of this form:
		"Orange": { "buildRampFrom": "#ff8c00" }
	...with a ramp of colors using that original color as index 100.
		"Orange" : { "100": { value: "#ff8c00" }, "20": { ... }, "120": { ... } }

	The formula used for this ramp is arbitrary and this is a proof-of-concept.
	RAMPS GENERATED WITH THIS DO NOT MATCH OUR CURRENT THINKING OF COLOR.
	Currently not intended for use outside of demos.
*/
export const buildColorRamps = (properties: TokenSet): TokenSet =>
{
	const colors = (properties as any).Global.Color
	for (const key in colors)
	{
		const color = colors[key]
		if (typeof color === "object" && "buildRampFrom" in color)
			replaceWithColorRamp(color)
	}

	return properties
}

const replaceWithColorRamp = (color: any): Token =>
{
	const colorInfo = new Color(color.buildRampFrom)
	delete color.buildRampFrom
	delete color.aliasOf

	color["20"] = { value: colorInfo.clone().lighten(40).toHexString() }
	color["40"] = { value: colorInfo.clone().lighten(30).toHexString() }
	color["60"] = { value: colorInfo.clone().lighten(20).toHexString() }
	color["80"] = { value: colorInfo.clone().lighten(10).toHexString() }
	color["100"] = { value: colorInfo.toHexString() }
	color["120"] = { value: colorInfo.clone().darken(10).toHexString() }
	color["140"] = { value: colorInfo.clone().darken(20).toHexString() }

	return color
}
