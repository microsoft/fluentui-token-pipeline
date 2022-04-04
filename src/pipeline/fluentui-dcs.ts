import StyleDictionary from "style-dictionary"
import Color from "tinycolor2"

import { Gradient, ValueToken } from "./types"
import * as Utils from "./utils"
import { degrees } from "./transform-math"
import path from "path"

const nameForCss = (path: any[]): string =>
{
	let name = path[0].includes("Global") ? path.join("-").toLowerCase() : `${path.join("")}`
	return name
}

StyleDictionary.registerTransform({
	name: "dcs/kebab",
	type: "name",
	transformer: prop => nameForCss(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransform({
	name: "dcs/alias/css",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${nameForCss(prop.resolvedAliasPath)})`,
})

StyleDictionary.registerTransform({
	name: "dcs/size/css",
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

export const colorToHexColor = (color: string): string =>
{
	const specialColor: string | undefined = specialColorNames[color.toLowerCase()]
	if (specialColor) return specialColor
	const tinycolor = Color(color)
	if (!tinycolor.isValid()) console.warn(`Unsupported color value: "${color}".`)
	return tinycolor.getAlpha() < 1 ? tinycolor.toHex8String() : tinycolor.toHexString()
}

const specialColorNames: Record<string, string> =
{
	// Common transparent color shortcut
	"transparent": "transparent",
	// Fully-supported high contrast colors
	"canvas": "Canvas",
	"canvastext": "CanvasText",
	"linktext": "LinkText",
	"graytext": "GrayText",
	"highlight": "Highlight",
	"highlighttext": "HighlightText",
	"buttonface": "ButtonFace",
	"buttontext": "ButtonText",
	// Other web-only forced colors not included:
	// https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#system_colors
}

export const colorTokenToHexColor = (token: ValueToken): string => colorToHexColor(token.value as string)

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

StyleDictionary.registerTransform({
	name: "dcs/color/css",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop =>
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
				`${colorTokenToHexColor(thisStop)}${isRegularTwoStop ? "" : ` ${isPixels ? `${thisStop.position}px` : percent(thisStop.position)}`}`
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
})

StyleDictionary.registerTransform({
	name: "dcs/strokealignment/css",
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

StyleDictionary.registerTransform({
	name: "dcs/shadow/css",
	type: "value",
	matcher: prop => prop.attributes.category === "shadow",
	transformer: prop =>
	{
		/*
			Transforms shadow properties into a CSS box-shadow property.
		*/
		return prop.value.map(shadow => `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${colorTokenToHexColor(shadow.color)}`).join(", ")
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/dcs",
	transforms: ["dcs/kebab", "dcs/alias/css", "dcs/size/css", "dcs/color/css", "dcs/strokealignment/css", "dcs/shadow/css"],
})
