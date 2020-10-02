import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"

/// Returns a Style Dictionary attributes object or null.
const getSDAttributes = (category, attribute) =>
{
	if (category === "Stroke")
	{
		if (attribute === "Width") return { category: "size", xamlType: "Thickness" }
	}
	if (category === "Corner")
	{
		if (attribute === "Radius") return { category: "size", xamlType: "CornerRadius" }
	}
	if (attribute === "Color") return { category: "color", xamlType: "SolidColorBrush" }
	if (attribute === "Padding") return { category: "size", xamlType: "Thickness" }
	if (category === "Layout")
	{
		if (attribute === "Width" || attribute === "Height") return { category: "size", xamlType: "x:Double" }
	}
	if (category === "Font")
	{
		if (attribute === "Family") return { category: "font", xamlType: "FontFamily" }
		if (attribute === "Size" || attribute === "LineHeight") return { category: "size", xamlType: "x:Double" }
		if (attribute === "Weight") return { category: "fontWeight", xamlType: "x:Double" }
	}
	return null
}

StyleDictionary.registerTransform({
	name: "fluentui/attribute",
	type: "attribute",
	transformer: (prop, options) =>
	{
		/*
			Transforms all properties to add appropriate category and xamlType fields.
			(Fluent UI token names use a different structure than the Category-Type-Item structure recommended
			by style-dictionary, so the built-in attribute/cti transform will not work.)
		*/
		let sdAttributes

		if (prop.path[0] === "Global")
		{
			// The category name in global tokens is optional. So, we'll try the type detection twice: first assuming it's
			// present, and then if that fails, assuming it's not.
			if (prop.path.length > 3)
				sdAttributes = getSDAttributes(prop.path[1], prop.path[2])
			if (!sdAttributes)
				sdAttributes = getSDAttributes(undefined, prop.path[1])
		}
		else
		{
			sdAttributes = getSDAttributes(prop.path[2], prop.path[3])
		}

		if (!sdAttributes)
			Utils.reportError(`Unable to determine data type based on token name "${prop.path.join(".")}".`)

		if (prop.resolvedAliasPath)
		{
			// This is an alias token, so its category is "alias", but we may still want to know what the category
			// WOULD have been if it were a direct value, so save that in "aliasCategory".
			sdAttributes.aliasCategory = sdAttributes.category
			sdAttributes.category = "alias"
		}

		return sdAttributes
	},
})

// Currently used below custom filters to separate colors, fonts and sizes into a different file.
StyleDictionary.registerFilter({
	name: "isColor",
	matcher: function (prop)
	{
		// var result = false
		// for (var index = 0; index < prop.path.length; index++) {
		// 	result = result || prop.path[index] == 'Color'
		// }
		return new Set(prop.path).has("Color")
	},
})

StyleDictionary.registerFilter({
	name: "isSize",
	matcher: function (prop)
	{
		const propSet = new Set(prop.path)
		return propSet.has("Width") || propSet.has("Padding") || propSet.has("Radius")
	},
})

StyleDictionary.registerFilter({
	name: "isFont",
	matcher: function (prop)
	{
		return new Set(prop.path).has("Font")
	},
})
