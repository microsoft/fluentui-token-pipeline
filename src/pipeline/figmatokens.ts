import StyleDictionary from "style-dictionary"
import _ from "lodash"

import { colorTokenToHexColor } from "./fluentui-css"
import { getValueOrReference } from "./fluentui-w3c"
import * as Utils from "./utils"

// Style Dictionary requires a name transform if any of your tokens have the same final name in the path, even if your output is nested.
StyleDictionary.registerTransform({
	name: "fluentui/name/figmatokens",
	type: "name",
	transformer: prop => Utils.getTokenExportPath(prop).join("."),
})

StyleDictionary.registerTransform({
	name: "fluentui/shadow/figmatokens",
	type: "value",
	matcher: prop => prop.attributes.category === "shadow",
	transformer: prop =>
	{
		const shadowsArray = prop.value.map(shadow =>
			({
				color: colorTokenToHexColor(shadow.color),
				x: shadow.x.toString(),
				y: shadow.y.toString(),
				blur: shadow.blur.toString(),
				spread: "0",
				type: "dropShadow",
			}))
		return shadowsArray.length === 1 ? shadowsArray[0] : shadowsArray
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/size/figmatokens",
	type: "value",
	matcher: prop => prop.attributes.category === "size" || prop.attributes.category === "fontWeight",
	transformer: prop =>
	{
		const value = prop.value
		if (typeof value === "number")
			return value.toString()

		Utils.reportError(`Can't properly export token ${prop.path.join(".")} = "${value}" because Figma only allows single values for dimensions.`)
		return value
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/font/figmatokens",
	type: "value",
	matcher: prop => prop.attributes.category === "font",
	transformer: prop =>
	{
		const value: string = prop.value
		if (value.startsWith("\""))
		{
			// The first font family in this list is a quoted string.
			const secondQuoteIndex = value.indexOf("\"", 1)
			if (secondQuoteIndex < 0)
			{
				Utils.reportError(`Invalid font family name ${prop.path.join(".")} = "${value}".`)
				return value
			}
			return value.substring(1, secondQuoteIndex)
		}
		else if (value.indexOf(",") > 0)
		{
			// The first font family in this list is unquoted.
			return value.substring(0, value.indexOf(","))
		}
		else
		{
			// This is a single font family name, or something we don't understand.
			return value
		}
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/letterspacing/figmatokens",
	type: "value",
	matcher: prop => prop.attributes.category === "letterSpacing",
	transformer: prop => `${prop.value * 100}%`,
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/figmatokens",
	transforms: ["fluentui/attribute", "fluentui/name/figmatokens", "time/seconds", "fluentui/size/figmatokens", "fluentui/color/css", "fluentui/font/figmatokens", "fluentui/strokealignment/css", "fluentui/letterspacing/figmatokens", "fluentui/shadow/figmatokens"],
})

StyleDictionary.registerFormat({
	name: "fluentui/figmatokens",
	formatter: (dictionary, config) =>
	{
		const tokens = getFigmaTokensJson(dictionary.allProperties)
		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})

export const getFigmaTokensJson = (props: any[], options: unknown = {}): any =>
{
	const RootNodeName = "Fluent"

	const tokens: any = { [RootNodeName]: { } }
	for (const thisProp of props)
	{
		// If this isn't a supported token type for Figma Tokens, just skip it.
		const type = thisProp.attributes.figmaTokensType
		if (type === null) continue

		// First, find or recreate this token's parent group in the new tokens object.
		let group: any = tokens.Fluent
		const path = thisProp.path[0] === "Set" ? thisProp.path.slice(1, -1) : thisProp.path.slice(0, -1)
		for (const segment of path)
		{
			if (segment in group)
				group = group[segment]
			else
				group = (group[segment] = {})
		}

		// Then, toss this token in there.
		const token = { type: type, value: getValueOrReference(thisProp) }
		group[thisProp.path[thisProp.path.length - 1]] = token
	}
	return tokens
}
