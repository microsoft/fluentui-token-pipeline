"use strict"

const StyleDictionary = require("style-dictionary")
const _ = require("lodash")

const Utils = require("./utils")

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
			(FluentUI token names use a different structure than the Category-Type-Item structure recommended
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
			console.error(`ERROR: Unable to determine data type based on token name "${prop.path.join(".")}".`)

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
