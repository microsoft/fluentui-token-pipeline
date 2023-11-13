import StyleDictionary from "style-dictionary"
import { colorToHexColor } from "./fluentui-css"

StyleDictionary.registerTransform({
	name: "fluentui/font-weight/string",
	type: "value",
	matcher: prop => prop.attributes.category === "fontWeight",
	transformer: prop => prop.value.toString(),
})

StyleDictionary.registerTransform({
	name: "fluentui/color/reactnative",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop =>
	{
		if (typeof prop.value === "string")
		{
			return colorToRNColor(prop.value)
		}
		else if (typeof prop.value === "object")
		{
			// Just pass gradient data as-is.
		}
		else
		{
			console.error(`Unrecognized color value: "${prop.value}". Specify a valid CSS color or a gradient definition.`)
			return prop.value
		}
	}
})

const colorToRNColor = (color: string) =>
{
	switch (color.toLowerCase())
	{
		case "transparent": return "transparent"

		case "canvas": return "PlatformColor(Window)"
		case "canvastext": return "PlatformColor(WindowText)"
		case "linktext": return "PlatformColor(Hotlight)"
		case "graytext": return "PlatformColor(GrayText)"
		case "highlight": return "PlatformColor(Highlight)"
		case "highlighttext": return "PlatformColor(HighlightText)"
		case "buttonface": return "PlatformColor(ButtonFace)"
		case "buttontext": return "PlatformColor(ButtonText)"

		// For other colors, match the CSS output.
		default: return colorToHexColor(color)
	}
}

StyleDictionary.registerFilter({
	name: "isGlobalShadow",
	matcher: prop => prop.path[0] === "Global" && prop.attributes.category === "shadow",
})

StyleDictionary.registerFilter({
	name: "isGlobalNotShadow",
	matcher: prop => prop.path[0] === "Global" && prop.attributes.category !== "shadow",
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/reactnative",
	transforms: ["fluentui/name/json/grouped", "fluentui/alias/flatten", "fluentui/color/reactnative", "fluentui/font/single", "fluentui/font-weight/string", "fluentui/shadow/json"],
})
