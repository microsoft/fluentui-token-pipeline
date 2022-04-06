import StyleDictionary from "style-dictionary"
import _ from "lodash"

import { colorTokenToHexColor } from "./fluentui-css"
import * as Utils from "./utils"

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
	name: "fluentui/shadow/w3c",
	type: "value",
	matcher: prop => prop.attributes.category === "shadow",
	transformer: prop =>
	{
		if (prop.value.length > 1)
			Utils.reportError(`Only the first shadow defined for token ${prop.path.join(".")} could be exported because the W3C format only supports single shadows.`)
		const shadow = prop.value[0]
		return {
			color: colorTokenToHexColor(shadow.color),
			offsetX: `${shadow.x}px`,
			offsetY: `${shadow.y}px`,
			blur: `${shadow.blur}px`,
			spread: "0px",
		}
	},
})

/*
	The Figma Tokens plugin uses a slightly different format for shadows, not supported here:
	"TOKEN_NAME": {
		"value": {
			"x": "0",
			"y": "0",
			"blur": "0",
			"spread": "0",
			"color": "#000000",
			"type": "dropShadow"
		},
		"type": "boxShadow"
	}
*/

StyleDictionary.registerTransformGroup({
	name: "fluentui/w3c",
	transforms: ["fluentui/attribute", "fluentui/name/w3c", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/w3c"],
})

StyleDictionary.registerFormat({
	name: "fluentui/w3c",
	formatter: (dictionary, config) =>
	{
		const tokens = getW3CJson(dictionary.allProperties)
		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})

StyleDictionary.registerFormat({
	name: "fluentui/w3c/legacy-nodollar",
	formatter: (dictionary, config) =>
	{
		const tokens = getW3CJson(dictionary.allProperties, { noDollarSigns: true })
		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})

export const getW3CJson = (props: any[], options: { noDollarSigns?: boolean } = {}): any =>
{
	const tokens: any = {}
	for (const thisProp of props)
	{
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
		const token = options.noDollarSigns ?
			{ type: getW3CType(thisProp), value: getValueOrReference(thisProp) } :
			{ $type: getW3CType(thisProp), $value: getValueOrReference(thisProp) }
		group[thisProp.path[thisProp.path.length - 1]] = token
	}
	return tokens
}

/// Converts an alias token into a W3C alias reference. (This can't be done earlier in the process because the W3C format uses the same format
/// for aliases that Style Dictionary does, and using Style Dictionary's syntax will cause Style Dictionary to try to resolve those aliases!)
const getValueOrReference = (prop: any): any =>
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

/// Converts a token's Style Dictionary category (including our proprietary extensions) to the appropriate W3C DTCG $type value, or null if none.
const getW3CType = (prop: any): string | null =>
{
	const category: string | undefined = prop.attributes.aliasCategory || prop.attributes.category
	switch (category)
	{
		case "color":
			if (typeof prop.original.value === "object")
			{
				Utils.reportError(`Can't properly export token ${prop.path.join(".")} because the W3C format does not have sufficent gradient support for our needs.`)
				return null
			}
			return "color"
		case "font":
			return "fontFamily"
		case "fontSize":
			return "fontSize"
		case "fontWeight":
			return "fontWeight"
		case "shadow":
			return "shadow"
		case "size":
			if (typeof prop.original.value === "object")
			{
				Utils.reportError(`Can't properly export token ${prop.path.join(".")} because the W3C format only allows single values for dimensions.`)
				return null
			}
			return "dimension"
		case "strokeAlignment":
			return "string"
		default:
			Utils.reportError(`Can't export token ${prop.path.join(".")} because the token type "${category}" is not supported.`)
			return null
	}
}
