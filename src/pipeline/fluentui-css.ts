import StyleDictionary from "style-dictionary"
import Color from "tinycolor2"

import { Gradient, ValueToken } from "./types"
import * as Utils from "./utils"
import { degrees } from "./transform-math"

const nameForCss = path => path.join("-").toLowerCase()

StyleDictionary.registerTransform({
	name: "fluentui/name/kebab",
	type: "name",
	transformer: prop => nameForCss(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransform({
	name: "fluentui/alias/css",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${nameForCss(prop.resolvedAliasPath)})`,
})

StyleDictionary.registerTransform({
	name: "fluentui/size/css",
	type: "value",
	matcher: prop => prop.attributes.category === "size",
	transformer: prop =>
	{
		/*
			Transforms an array of top/right/bottom/left values into a CSS margin or padding string.
			Single values are also allowed. All numbers are interpreted as pixels.

			100
				-->
			100px

			[ 100, 200, 300, 400 ]
				-->
			100px 200px 300px 400px
		*/
		const value = prop.value
		if (typeof value === "number")
			return `${value}px`
		else if (Array.isArray(value) && value.length === 4)
			return `${value[0]}px ${value[1]}px ${value[2]}px ${value[3]}px`

		console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
		return value
	},
})

const colorToHexColor = (color: string) =>
{
	if (color === "transparent") return "transparent"
	return Color(color).toHexString()
}

const colorTokenToHexColor = (token: ValueToken, flat: boolean) =>
{
	if (!flat && "resolvedAliasPath" in token)
		return `var(--${nameForCss((token as any).resolvedAliasPath)})`
	else
		return colorToHexColor(token.value as string)
}

/**
	Takes an angle of the start of a gradient and transforms it into the format required by CSS linear-gradient().
	(linear-gradient uses common shorthand words and requires the angle of the END of the gradient.)
 	@param deg An angle of the start of a gradient in degrees counting clockwise from 0° at the top.
	@returns A CSS angle for use in linear-gradient().
 */
const cssAngle = (deg: number) =>
{
	switch (deg)
	{
		case 0: return "to bottom"
		case 90: return "to left"
		case 180: return "to top"
		case 270: return "to right"
		default: return (deg > 180) ? `${deg}deg` : `${deg + 180}deg`
	}
}

const percent = (float: number) => `${(float * 100)}%`

const transformColor = (prop: any, flat: boolean): any =>
{
	/*
		Normalizes valid CSS color values for output.

		OR, if the property describes a gradient, it exports that gradient as a linear-gradient() CSS function.
	*/
	if (typeof prop.value === "string")
	{
		return colorToHexColor(prop.value)
	}
	else if (typeof prop.value === "object")
	{
		const gradient = prop.value as Gradient
		const x1: number = gradient.start[0]
		const y1: number = gradient.start[1]
		const x2: number = gradient.end[0]
		const y2: number = gradient.end[1]
		const isPixels = gradient.stopsUnits === "pixels"
		const isRegularTwoStop = !isPixels && gradient.stops.length === 2 && gradient.stops[0].position === 0 && gradient.stops[1].position === 1

		const stopsText = gradient.stops.map(thisStop =>
			`${colorTokenToHexColor(thisStop, flat)}${isRegularTwoStop ? "" : ` ${isPixels ? `${thisStop.position}px` : percent(thisStop.position)}`}`
		).join(", ")

		const angleText = cssAngle(90 - degrees(Math.atan2(y2 - y1, x1 - x2)))
		return `linear-gradient(${angleText}, ${stopsText})`
	}
	else
	{
		console.error(`Unrecognized color value: "${prop.value}". Specify a valid CSS color or a gradient definition.`)
		return prop.value
	}
}

StyleDictionary.registerTransform({
	name: "fluentui/color/css",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop => transformColor(prop, /* flat: */ false)
})

StyleDictionary.registerTransform({
	name: "fluentui/color/cssflat",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop => transformColor(prop, /* flat: */ true)
})

StyleDictionary.registerTransform({
	name: "fluentui/strokealignment/css",
	type: "value",
	matcher: prop => prop.attributes.category === "strokeAlignment",
	transformer: prop =>
	{
		/*
			Transforms a Figma stroke alignment into a CSS background-clip enum value.
		*/
		switch (prop.value.toLowerCase())
		{
			case "inner": return "border-box"
			case "outer": return "padding-box"
			default:
				console.error(`Unrecognized stroke alignment: "${prop.value}". Specify "inner" or "outer".`)
				return prop.value
		}
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/css",
	transforms: ["fluentui/attribute", "fluentui/name/kebab", "fluentui/alias/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css"],
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/cssflat",
	transforms: ["fluentui/attribute", "fluentui/name/kebab", "time/seconds", "fluentui/size/css", "fluentui/color/cssflat", "fluentui/strokealignment/css"],
})
