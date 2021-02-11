import StyleDictionary from "style-dictionary"
import Color from "tinycolor2"
import _ from "lodash"

import { Gradient, ValueToken } from "./types"
import * as Utils from "./utils"
import { degrees } from "./transform-math"

const nameForWinUI = path => _.upperFirst(_.camelCase(path.join(" ")))

StyleDictionary.registerTransform({
	name: "fluentui/name/pascal",
	type: "name",
	transformer: prop => nameForWinUI(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransform({
	name: "fluentui/alias/winui",
	type: "attribute",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop =>
	{
		return { aliasResourceName: nameForWinUI(prop.resolvedAliasPath) }
	},
})

const winuiInvalidFontFamilies = new Set([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"emoji",
	"math",
	"fangsong",
])

StyleDictionary.registerTransform({
	name: "fluentui/font/winui",
	type: "value",
	matcher: prop => prop.attributes.category === "font",
	transformer: prop =>
	{
		/*
			Transforms a CSS font-family string to one for Microsoft.UI.Xaml.Media.FontFamily.

			"Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif
				-->
			Segoe UI, Roboto, Helvetica Neue, Helvetica, Arial
		*/
		const transformedList = prop.value.split(",").map((family) =>
		{
			const trimmed = family.trim()
			const minusDoubleQuotes = trimmed.startsWith("\"") && trimmed.endsWith("\"") ? trimmed.substring(1, trimmed.length - 1) : trimmed
			return minusDoubleQuotes.startsWith("'") && minusDoubleQuotes.endsWith("'")
				? minusDoubleQuotes.substring(1, minusDoubleQuotes.length - 1)
				: minusDoubleQuotes
		})
		if (transformedList.length === 0)
			return ""
		if (winuiInvalidFontFamilies.has(transformedList[transformedList.length - 1]))
			transformedList.pop()
		return transformedList.join(", ")
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/size/winui",
	type: "value",
	matcher: prop => prop.attributes.category === "size",
	transformer: prop =>
	{
		/*
			Transforms an array of top/right/bottom/left values into a string for Microsoft.UI.Xaml.Thickness.
			Single values are also allowed. Note that when four values are specified, the input order is as in CSS,
			which must be rotated to be used in WinUI (left, top, right, bottom).

			[ 100, 200, 300, 400 ]
				-->
			400, 100, 200, 300

			Exception: If the property is a corner radius, the values are NOT rotated—both CSS and WinUI use
			top-left, top-right, bottom-right, bottom-left for the order. Asymmetrical corner radii (using a slash)
			are not supported.
		*/
		const value = prop.value
		if (typeof value === "number")
		{
			return value.toString()
		}
		else if (value.includes("/"))
		{
			console.warn(`Size values with a slash are not currently supported: "${value}".`)
		}
		else if (Array.isArray(value) && value.length === 4)
		{
			return prop.attributes.xamlType !== "CornerRadius"
				? `${value[3]}, ${value[0]}, ${value[1]}, ${value[2]}`
				: `${value[0]}, ${value[1]}, ${value[2]}, ${value[3]}`
		}
		else
		{
			console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
			return value
		}
	},
})

const colorToWFColor = (color: string) =>
{
	if (color === "transparent") return "Transparent"
	const str = Color(color).toHex8()
	return `#${str.slice(6)}${str.slice(0, 6)}`
}

const colorTokenToWFColor = (token: ValueToken) =>
{
	// WinUI exports currently don't use aliases because WinUI exports individual colors as SolidColorBrush rather than
	// Color, but GradientStops require Color, so they can't reference the brush tokens. The following code "works" except
	// for that limitation. It can be enabled in the future if WinUI decides that they want both Color AND SolidColorBrush
	// values per color, which is likely.

	// if ("resolvedAliasPath" in token)
	// 	// We need to include "{StaticResource ...}" in the property value, but Style Dictionary interprets that as string
	// 	// replacement markup, with no way to escape it. So we replace the { } with < > and fix it up when exporting. :(
	// 	return `<StaticResource ${nameForWinUI((token as any).resolvedAliasPath)}>`
	// else

	return colorToWFColor(token.value as string)
}

StyleDictionary.registerTransform({
	name: "fluentui/color/winui",
	type: "value",
	matcher: prop => prop.attributes.category === "color",
	transformer: prop =>
	{
		/*
			Transforms a valid CSS color value into a string for Windows.Foundation.Color.

			OR, if the property describes a gradient, it exports that gradient as the entire XAML markup for a LinearGradientBrush.
		*/
		if (typeof prop.value === "string")
		{
			return colorToWFColor(prop.value)
		}
		else if (typeof prop.value === "object")
		{
			const gradient = prop.value as Gradient
			const x1: number = gradient.start[0]
			const y1: number = gradient.start[1]
			const x2: number = gradient.end[0]
			const y2: number = gradient.end[1]
			const isPixels = gradient.stopsUnits === "pixels"
			const maxPosition = isPixels ? gradient.stops.reduce<number>((largest, pos) => Math.max(largest, pos.position), 0) : 1.0

			const stopsXaml = gradient.stops.map(thisStop =>
				`\t\t<GradientStop Offset="${thisStop.position / maxPosition}" Color="${colorTokenToWFColor(thisStop)}" />`
			).join("\n")

			let xaml: string
			if (isPixels)
			{
				// Gradient stops in pixels are a bit more complex.
				// MappingMode=Absolute causes the StartPoint and EndPoint values to be interpreted as pixels instead of [0-1], but
				// GradientStop.Offset still needs to be specified as [0-1], and to get anything other than a top-down or left-to-right gradient,
				// we need to apply a rotation.
				const angle = 90 - degrees(Math.atan2(y2 - y1, x1 - x2))
				xaml =
`<LinearGradientBrush x:Key="${prop.name}" MappingMode="Absolute" StartPoint="0, 0" EndPoint="0, ${maxPosition}">
	<LinearGradientBrush.RelativeTransform>
		<RotateTransform Angle="${angle}" CenterX="0.5" CenterY="0.5" />
	</LinearGradientBrush.RelativeTransform>
	<LinearGradientBrush.GradientStops>
${stopsXaml}
	</LinearGradientBrush.GradientStops>
</LinearGradientBrush>`
			}
			else
			{
				xaml =
`<LinearGradientBrush x:Key="${prop.name}" StartPoint="${x1}, ${y1}" EndPoint="${x2}, ${y2}">
	<LinearGradientBrush.GradientStops>
${stopsXaml}
	</LinearGradientBrush.GradientStops>
</LinearGradientBrush>`
			}

			return { xaml: xaml }
		}
		else
		{
			console.error(`Unrecognized color value: "${prop.value}". Specify a valid CSS color or a gradient definition.`)
			return prop.value
		}
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/winui",
	transforms: ["fluentui/attribute", "fluentui/name/pascal", "fluentui/alias/winui", "fluentui/size/winui", "fluentui/font/winui", "fluentui/color/winui"],
})

const getAllResourcesAsString = (dictionary, indent) =>
{
	const tabs = "\t".repeat(indent)
	return dictionary.allProperties.map((prop) =>
	{
		if (prop.attributes.aliasResourceName)
		{
			return `${tabs}<StaticResource x:Key="${prop.name}" ResourceKey="${prop.attributes.aliasResourceName}" />`
		}
		else if (typeof prop.value === "object" && "xaml" in prop.value)
		{
			// The .replace(StaticResource) bit here is due to a Style Dictionary limitation—see colorTokenToWFColor for details.
			return `${tabs}${prop.value.xaml.replace(/\n/g, `\n${tabs}`).replace(/<StaticResource (\w+)>/g, "{StaticResource $1}")}`
		}
		else
		{
			const xamlType = prop.attributes.xamlType || "x:String"
			return `${tabs}<${xamlType} x:Key="${prop.name}">${Utils.escapeXml(prop.value)}</${xamlType}>`
		}
	}).join("\n")
}

StyleDictionary.registerFormat({
	name: "fluentui/xaml/res",
	formatter: (dictionary, config) =>
	{
		const resources = getAllResourcesAsString(dictionary, /* indent: */ 1)
		return `<ResourceDictionary
	xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
	xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

	<!--
		Do not edit this file directly.
		Generated on ${new Date().toUTCString()}
	-->

${resources}

</ResourceDictionary>`
	},
})

StyleDictionary.registerFormat({
	name: "fluentui/xaml/res/themed",
	formatter: (dictionary, config) =>
	{
		const resources = getAllResourcesAsString(dictionary, /* indent: */ 3)
		return `<ResourceDictionary
	xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
	xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

	<!--
		Do not edit this file directly.
		Generated on ${new Date().toUTCString()}
	-->

    <ResourceDictionary.ThemeDictionaries>
		<ResourceDictionary x:Key="Default">
${resources}
		</ResourceDictionary>
		<ResourceDictionary x:Key="Light">
${resources}
		</ResourceDictionary>
		<ResourceDictionary x:Key="HighContrast">
${resources}
		</ResourceDictionary>
	</ResourceDictionary.ThemeDictionaries>

</ResourceDictionary>`
	},
})
