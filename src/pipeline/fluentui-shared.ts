import StyleDictionary from "style-dictionary"
import type { TokenSet } from "./types"
import * as Utils from "./utils"

/// Returns a Style Dictionary attributes object or null.
const getSDAttributes = (category, attribute) =>
{
	if (category === "Stroke")
	{
		if (attribute === "Width") return { category: "size", w3cType: "dimension", figmaTokensType: "borderWidth", xamlType: "Thickness" }
		if (attribute === "Alignment") return { category: "strokeAlignment", w3cType: "string", xamlType: "BackgroundSizing" }
	}
	if (category === "Corner")
	{
		if (attribute === "Radius") return { category: "size", w3cType: "dimension", figmaTokensType: "borderRadius", xamlType: "CornerRadius" }
	}
	// Color is a special case: you can skip the word before it (Fill or Stroke) in case your color sets are more general and not specific to fills or strokes.
	if (category === "Color" || attribute === "Color") return { category: "color", w3cType: "color", figmaTokensType: "color", xamlType: "SolidColorBrush" } // Can also be a LinearGradientBrush: the fluentui/xaml/res formats won't use the xamlType in that case
	if (attribute === "Padding") return { category: "size", w3cType: "dimension", figmaTokensType: "spacing", xamlType: "Thickness" }
	if (attribute === "Spacing") return { category: "size", w3cType: "dimension", figmaTokensType: "spacing", xamlType: "x:Double" }
	if (attribute === "Size") return { category: "size", w3cType: "dimension", figmaTokensType: "spacing", xamlType: "x:Double" }
	if (category === "Layout")
	{
		if (attribute === "Width" || attribute === "Height") return { category: "size", w3cType: "dimension", figmaTokensType: "sizing", xamlType: "x:Double" }
	}
	if (category === "Font")
	{
		if (attribute === "Family") return { category: "font", w3cType: "fontFamily", figmaTokensType: "fontFamilies", xamlType: "FontFamily" }
		if (attribute === "Size") return { category: "size", w3cType: "fontSize", figmaTokensType: "fontSizes", xamlType: "x:Double" }
		if (attribute === "LineHeight" || attribute === "Line Height") return { category: "size", w3cType: "dimension", figmaTokensType: "lineHeights", xamlType: "x:Double" }
		if (attribute === "Weight") return { category: "fontWeight", w3cType: "fontWeight", figmaTokensType: "fontWeights", xamlType: "x:Double" }
		if (attribute === "LetterSpacing" || attribute === "Letter Spacing") return { category: "letterSpacing", w3cType: "dimension", figmaTokensType: "letterSpacing", xamlType: "x:Int32" }
	}
	if (category === "Shadow" || attribute === "Shadow")
	{
		return { category: "shadow", w3cType: "shadow", figmaTokensType: "boxShadow", xamlType: "none" } // WinUI uses Z-axis translation and doesn't support this kind of shadow natively
	}
	return null
}

export const setAttributesFromNames = (tokens: TokenSet): TokenSet =>
{
	// IMPORTANT! This is designed to be used AFTER resolveAliases and its kin. It will miss things like aliases if any remain.
	Utils.forEachRecursive(tokens, (prop: any, path: ReadonlyArray<string>) =>
	{
		// If the token already has a category set (normal for W3C files), skip it.
		if (prop.attributes && prop.attributes.category) return

		/*
			Transforms all properties to add appropriate category and xamlType fields.
			(Fluent UI token names use a different structure than the Category-Type-Item structure recommended
			by style-dictionary, so the built-in attribute/cti transform will not work.)
		*/
		let sdAttributes: any

		if (path[0] === "Global")
		{
			// The category name in global tokens is optional. So, we'll try the type detection twice: first assuming it's
			// present, and then if that fails, assuming it's not.
			if (path.length > 3)
				sdAttributes = getSDAttributes(path[1], path[2])
			if (!sdAttributes)
				sdAttributes = getSDAttributes(undefined, path[1])
		}
		else
		{
			sdAttributes = path[path.length - 1] === "Color"
				? getSDAttributes(path[path.length - 2], path[path.length - 1])
				: getSDAttributes(path[1], path[2])
		}

		if (!sdAttributes)
			Utils.reportError(`Unable to determine data type based on token name "${path.join(".")}".`)

		if (sdAttributes && prop.resolvedAliasPath)
		{
			// This is an alias token, so its category is "alias", but we may still want to know what the category
			// WOULD have been if it were a direct value, so save that in "aliasCategory".
			sdAttributes.aliasCategory = sdAttributes.category
			sdAttributes.category = "alias"
		}

		prop.attributes = sdAttributes
	}, { requiredChild: "value" })
	return tokens
}

StyleDictionary.registerTransform({
	name: "fluentui/alias/flatten",
	type: "attribute",
	matcher: prop => "aliasCategory" in prop.attributes,
	transformer: (prop, options) =>({ category: prop.attributes.aliasCategory }),
})

StyleDictionary.registerFilter({
	name: "isAlias",
	matcher: prop => prop.path[0] !== "Global",
})

StyleDictionary.registerFilter({
	name: "isGlobal",
	matcher: prop => prop.path[0] === "Global",
})

StyleDictionary.registerFilter({
	name: "isColor",
	matcher: prop => prop.attributes.category === "color",
})

// This is only for the Build demo iOS export. Don't use it in new code.
StyleDictionary.registerFilter({
	name: "isSize",
	matcher: function (prop)
	{
		const propSet = new Set(prop.path)
		return propSet.has("Width") || propSet.has("Padding") || propSet.has("Radius")
	},
})

// This is only for the Build demo iOS export. Don't use it in new code.
StyleDictionary.registerFilter({
	name: "isFont",
	matcher: function (prop)
	{
		return new Set(prop.path).has("Font")
	},
})
