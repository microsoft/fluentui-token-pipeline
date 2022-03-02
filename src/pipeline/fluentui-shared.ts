import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"

/// Returns a Style Dictionary attributes object or null.
const getSDAttributes = (category, attribute) =>
{
	if (category === "Stroke")
	{
		if (attribute === "Width") return { category: "size", xamlType: "Thickness" }
		if (attribute === "Alignment") return { category: "strokeAlignment", xamlType: "BackgroundSizing" }
	}
	if (category === "Corner")
	{
		if (attribute === "Radius") return { category: "size", xamlType: "CornerRadius" }
	}
	// Color is a special case: you can skip the word before it (Fill or Stroke) in case your color sets are more general and not specific to fills or strokes.
	if (category === "Color" || attribute === "Color") return { category: "color", xamlType: "SolidColorBrush" } // Can also be a LinearGradientBrush: the fluentui/xaml/res formats won't use the xamlType in that case
	if (attribute === "Padding") return { category: "size", xamlType: "Thickness" }
	if (attribute === "Spacing") return { category: "size", xamlType: "x:Double" }
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
	if (category === "Shadow" || attribute === "Shadow")
	{
		return { category: "shadow", xamlType: "none" } // WinUI uses Z-axis translation and doesn't support this kind of shadow natively
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
			sdAttributes = prop.path[prop.path.length - 2] === "Color"
				? getSDAttributes(prop.path[prop.path.length - 3], prop.path[prop.path.length - 2])
				: getSDAttributes(prop.path[2], prop.path[3])
		}

		if (!sdAttributes)
			Utils.reportError(`Unable to determine data type based on token name "${prop.path.join(".")}".`)

		if (sdAttributes && prop.resolvedAliasPath)
		{
			// This is an alias token, so its category is "alias", but we may still want to know what the category
			// WOULD have been if it were a direct value, so save that in "aliasCategory".
			sdAttributes.aliasCategory = sdAttributes.category
			sdAttributes.category = "alias"
		}

		return sdAttributes
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/alias/flatten",
	type: "attribute",
	matcher: prop => "aliasCategory" in prop.attributes,
	transformer: (prop, options) =>({ category: prop.attributes.aliasCategory }),
})

StyleDictionary.registerFilter({
	name: "isAlias",
	matcher: prop => prop.path[0] === "Set",
})

StyleDictionary.registerFilter({
	name: "isGlobal",
	matcher: prop => prop.path[0] === "Global",
})

StyleDictionary.registerFilter({
	name: "isControl",
	matcher: prop =>
	{
		const rootName = prop.path[0]
		return rootName !== "Global" && rootName !== "Set"
	},
})

// This is only for the Build demo iOS export. Don't use it in new code.
StyleDictionary.registerFilter({
	name: "isColor",
	matcher: function (prop)
	{
		return new Set(prop.path).has("Color")
	},
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
