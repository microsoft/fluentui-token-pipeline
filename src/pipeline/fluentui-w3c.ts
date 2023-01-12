import StyleDictionary from "style-dictionary"
import _ from "lodash"

import type { Gradient } from "./types"
import * as Utils from "./utils"
import { colorToHexColorFallback, colorTokenToHexColorFallback } from "./fluentui-css"

/*
	IMPORTANT: The W3C Design Tokens Community Group format spec is still evolving.
	This output will become outdated over time.

	Valid $type values as of 5 April 2022 - https://design-tokens.github.io/community-group/format/#types
	- Generic types: https://design-tokens.github.io/community-group/format/#type-0
	- Scalar types: https://design-tokens.github.io/community-group/format/#types
	- Composite types: https://design-tokens.github.io/community-group/format/#composite-types
*/

// Style Dictionary requires a name transform if any of your tokens have the same final name in the path, even if your output is nested.
StyleDictionary.registerTransform({
	name: "fluentui/name/w3c",
	type: "name",
	transformer: prop => Utils.getTokenExportPath(prop).join("."),
})

StyleDictionary.registerTransform({
	name: "fluentui/color/w3c",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop =>
	{
		if (typeof prop.value === "string")
		{
			return colorToHexColorFallback(prop.value)
		}
		else if (typeof prop.value === "object")
		{
			const gradient = prop.value as Gradient
			// WARNING: Loss of precision: the W3C/DTCG format for gradients doesn't support angles or pixel stops.
			// We may need to provide that information as extensions.
			prop.attributes.w3cType = "gradient"
			return gradient.stops.map(thisStop => ({ color: colorToHexColorFallback(thisStop.value as string), position: thisStop.position }))
		}
		else
		{
			console.error(`Unrecognized color value: "${prop.value}".`)
			return prop.value
		}
	}
})

StyleDictionary.registerTransform({
	name: "fluentui/letterspacing/w3c",
	type: "value",
	matcher: prop => prop.attributes.category === "letterSpacing",
	transformer: prop => `${prop.value}rem`,
})

StyleDictionary.registerTransform({
	name: "fluentui/shadow/w3c",
	type: "value",
	matcher: prop => prop.attributes.category === "shadow",
	transformer: prop =>
	{
		if (prop.value.length > 1)
			Utils.reportError(`Only the first shadow defined for token ${prop.path.join(".")} could be exported because the W3C format only supports single shadows.`)
		const shadow = prop.value[0]
		return {
			color: colorTokenToHexColorFallback(shadow.color),
			offsetX: `${shadow.x}px`,
			offsetY: `${shadow.y}px`,
			blur: `${shadow.blur}px`,
			spread: "0px",
		}
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/w3c",
	transforms: ["fluentui/name/w3c", "time/seconds", "fluentui/size/css", "fluentui/color/w3c", "fluentui/strokealignment/css", "fluentui/letterspacing/w3c", "fluentui/shadow/w3c"],
})

// TODO: The current draft as of 10 May 2022 specifies that font families should be an array of strings, not a single CSS string.

StyleDictionary.registerFormat({
	name: "fluentui/w3c",
	formatter: (dictionary, config) =>
	{
		const tokens = getW3CJson(dictionary.allProperties)
		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})

export const getW3CJson = (props: any[], options: unknown = {}): any =>
{
	const tokens: any = {}
	for (const thisProp of props)
	{
		// If this isn't a supported token type in the W3C format, just skip it.
		const type = thisProp.attributes.w3cType
		if (type === null) continue

		// First, find or recreate this token's parent group in the new tokens object.
		let group: any = tokens
		for (const segment of thisProp.path.slice(0, -1))
		{
			if (segment in group)
				group = group[segment]
			else
				group = (group[segment] = {})
		}

		// Then, toss this token in there.
		const token = { $type: type, $value: getValueOrReference(thisProp) }
		group[thisProp.path[thisProp.path.length - 1]] = token
	}
	return tokens
}

/// Converts an alias token into a W3C alias reference. (This can't be done earlier in the process because the W3C format uses the same format
/// for aliases that Style Dictionary does, and using Style Dictionary's syntax will cause Style Dictionary to try to resolve those aliases!)
export const getValueOrReference = (prop: any): any =>
{
	if (prop.resolvedAliasPath)
	{
		return `{${prop.resolvedAliasPath.join(".")}}`
	}
	else
	{
		return prop.value
	}
}
