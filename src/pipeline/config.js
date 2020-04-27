"use strict"

const _ = require("lodash")

const FluentUIAliases = require("./fluentui-aliases")
require("./fluentui-shared")
require("./fluentui-css")
require("./fluentui-html")
require("./fluentui-winui")

// ------------------------------------------------------------
// Configure pipeline input and output here
// ------------------------------------------------------------

/*
	List at least one input JSON file, relative to config.js, not the root of the repo.

	To see the pipeline merge multiple JSON files together, try adding "../tokens/example-red-accent.json" to the array.
*/
const inputTokenFiles = ["../tokens/fluentui.json"]

/*
	Specify the path to where output files should be generated, relative to the root of the repo.
	Additional folders will be included within that one.
*/
const outputPath = "./build/"

// ------------------------------------------------------------

const tokens = {}
inputTokenFiles.forEach((inputFile) => _.merge(tokens, require(inputFile)))

module.exports = {
	properties: FluentUIAliases.resolveAliases(tokens),
	platforms: {
		debug: {
			transformGroup: "js",
			buildPath: outputPath,
			files: [{ destination: "debug/fluentuitokens-debug.json", format: "json" }],
		},

		reference: {
			transformGroup: "fluentui/html",
			buildPath: outputPath,
			files: [{ destination: "reference/fluentuitokens.html", format: "fluentui/html/reference" }],
		},

		ios: {
			transformGroup: 'fluentui/swift',
			buildPath: buildPath,
			files: [
				{ destination: 'ios/FluentUITokens.swift', format: 'ios-swift/class.swift', className: 'FluentUITokens' },
				{ destination: 'ios/FluentUIColorTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUIColorTokens', filter: 'isColor' },
				{ destination: 'ios/FluentUISizeTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUISizeTokens', filter: 'isSize' },
				{ destination: 'ios/FluentUIFontTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUIFontTokens', filter: 'isFont' },
			],
		},

		css: {
			transformGroup: "fluentui/css",
			buildPath: outputPath,
			files: [{ destination: "web/fluentuitokens.css", format: "css/variables" }],
		},

		cssflat: {
			transformGroup: "fluentui/cssflat",
			buildPath: outputPath,
			files: [{ destination: "web/fluentuitokens-flat.css", format: "css/variables" }],
		},

		winui: {
			transformGroup: "fluentui/winui",
			buildPath: outputPath,
			files: [{ destination: "winui/FluentUITokens.xaml", format: "fluentui/xaml/res" }],
		},
	},
}]

// ------------------------------------------------------------
// FluentUI-specific utilities
// ------------------------------------------------------------

/// Returns a Style Dictionary attributes object or null.
const getSDAttributes = (category, attribute) =>
{
	if (category === 'Stroke')
	{
		if (attribute === 'Width') return { category: 'size', xamlType: 'Thickness' }
	}
	if (category === 'Corner')
	{
		if (attribute === 'Radius') return { category: 'size', xamlType: 'CornerRadius' }
	}
	if (attribute === 'Color') return { category: 'color', xamlType: 'SolidColorBrush' }
	if (attribute === 'Padding') return { category: 'size', xamlType: 'Thickness' }
	if (category === 'Font')
	{
		if (attribute === 'Family') return { category: 'font', xamlType: 'FontFamily' }
		if (attribute === 'Size' || attribute === 'LineHeight') return { category: 'size', xamlType: 'x:Double' }
		if (attribute === 'Weight') return { category: 'fontWeight', xamlType: 'x:Double' }
	}
	return null
}

const charactersToEscape = /([\<\>\&])/g
const escapedCharacters = {
	'<': '&lt;',
	'>': '&gt;',
	'&': '&amp;',
}
const escapeXml = (text) =>
	(typeof text === 'string' ? text : text.toString()).replace(charactersToEscape, (char) => escapedCharacters[char])

const getModifiedPathForNaming = (path, prefix) =>
{
	// Strip off "Set" if present, and prepend the prefix if specified.
	// Only makes a copy of the array if necessary; otherwise, it just returns the original array.
	const isSet = path[0] === 'Set'
	if (isSet || prefix)
	{
		if (prefix)
			return [prefix, ...(isSet ? path.slice(1) : path)]
		else
			return path.slice(1)
	}
	else
	{
		return path
	}
}

// ------------------------------------------------------------
// Output settings: common
// ------------------------------------------------------------

StyleDictionary.registerTransform({
	name: 'fluentui/attribute',
	type: 'attribute',
	transformer: (prop, options) =>
	{
		if (prop.resolvedAliasPath)
			return { category: 'alias' }

		/*
			Transforms all properties to add appropriate category and xamlType fields.
			(FluentUI token names use a different structure than the Category-Type-Item structure recommended
			by style-dictionary, so the built-in attribute/cti transform will not work.)
		*/
		let sdAttributes

		if (prop.path[0] === 'Global')
		{
			// The category name in global tokens is optional. So, we'll try the type detection twice: first assuming it's
			// present, and then if that fails, assuming it's not.
			if (prop.path.length > 3)
			{
				sdAttributes = getSDAttributes(prop.path[1], prop.path[2])
				if (sdAttributes) return sdAttributes
			}
			sdAttributes = getSDAttributes(undefined, prop.path[1])
			if (sdAttributes) return sdAttributes
		}
		else
		{
			sdAttributes = getSDAttributes(prop.path[2], prop.path[3])
			if (sdAttributes) return sdAttributes
		}

		console.log(`ERROR: Unable to determine data type based on token name "${prop.path.join('.')}".`)
	},
})

// Currently used below custom filters to separate colors, fonts and sizes into a different file.
StyleDictionary.registerFilter({
	name: 'isColor',
	matcher: function (prop)
	{
		// var result = false
		// for (var index = 0; index < prop.path.length; index++) {
		// 	result = result || prop.path[index] == 'Color'
		// }
		return new Set(prop.path).has("Color")
	}
})

StyleDictionary.registerFilter({
	name: 'isSize',
	matcher: function (prop)
	{
		let propSet = new Set(prop.path)
		return propSet.has("Width") || propSet.has("Padding") || propSet.has("Radius")
	}
})

StyleDictionary.registerFilter({
	name: 'isFont',
	matcher: function (prop)
	{
		return new Set(prop.path).has("Font")
	}
})

// ------------------------------------------------------------
// Output settings: Swift
// ------------------------------------------------------------

const getNameForSwift = (path, prefix) =>
	_.camelCase(getModifiedPathForNaming(path, prefix).join(' '))

const getCGFloatFromNumber = (value) =>
	parseFloat(value, 10).toFixed(1)

StyleDictionary.registerTransform({
	name: 'fluentui/name/swift',
	type: 'name',
	transformer: (prop, options) => getNameForSwift(prop.path, options.prefix),
})

StyleDictionary.registerTransform({
	name: 'fluentui/alias/swift',
	type: 'value',
	matcher: (prop) => "resolvedAliasPath" in prop,
	transformer: (prop, options) => `${getNameForSwift(prop.resolvedAliasPath.split("."), options.prefix)}`,
})

StyleDictionary.registerTransform({
	name: 'fluentui/size/swift',
	type: 'value',
	matcher: (prop) => prop.attributes.category === 'size',
	transformer: (prop, options) =>
	{
		/*
			Transforms an array of top/right/bottom/left values into UIEdgeInsets(top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat).
			Single values are also allowed. All numbers are interpreted as pixels.
	
			100
				-->
			100.0
	
			[ 100, 200, 300, 400 ]
				-->
			UIEdgeInsets(top: 100.0, left: 400.0, bottom: 300.0, right: 200.0)
		*/
		const value = prop.value
		if (typeof value === 'number')
			return `${getCGFloatFromNumber(value)}`
		else if (Array.isArray(value) && value.length === 4)
			return `UIEdgeInsets(top: ${getCGFloatFromNumber(value[0])}, left: ${getCGFloatFromNumber(value[3])}, bottom: ${getCGFloatFromNumber(value[2])}, right: ${getCGFloatFromNumber(value[1])})`
		else
			console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
	},
})

StyleDictionary.registerTransformGroup({
	name: 'fluentui/swift',
	transforms: ['fluentui/attribute', 'fluentui/name/swift', 'fluentui/alias/swift', 'time/seconds', 'fluentui/size/swift', 'font/swift/literal', 'color/UIColorSwift'],
})


// ------------------------------------------------------------
// Output settings: CSS
// ------------------------------------------------------------

const getNameForCss = (path, prefix) =>
	getModifiedPathForNaming(path, prefix)
		.join('-')
		.toLowerCase()

StyleDictionary.registerTransform({
	name: 'fluentui/name/kebab',
	type: 'name',
	transformer: (prop, options) => getNameForCss(prop.path, options.prefix),
})

StyleDictionary.registerTransform({
	name: 'fluentui/alias/css',
	type: 'value',
	matcher: (prop) => "resolvedAliasPath" in prop,
	transformer: (prop, options) => `var(--${getNameForCss(prop.resolvedAliasPath.split("."), options.prefix)})`,
})

StyleDictionary.registerTransform({
	name: 'fluentui/size/css',
	type: 'value',
	matcher: (prop) => prop.attributes.category === 'size',
	transformer: (prop, options) =>
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
		if (typeof value === 'number')
			return `${value}px`
		else if (Array.isArray(value) && value.length === 4)
			return `${value[0]}px ${value[1]}px ${value[2]}px ${value[3]}px`
		else
			console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
	},
})

StyleDictionary.registerTransformGroup({
	name: 'fluentui/css',
	transforms: ['fluentui/attribute', 'fluentui/name/kebab', 'fluentui/alias/css', 'time/seconds', 'fluentui/size/css', 'color/css'],
})

StyleDictionary.registerTransformGroup({
	name: 'fluentui/cssflat',
	transforms: ['fluentui/attribute', 'fluentui/name/kebab', 'time/seconds', 'fluentui/size/css', 'color/css'],
})

// ------------------------------------------------------------
// Output settings: WinUI
// ------------------------------------------------------------

/*
	TODO: Annotate certain tokens with a "winuiKey" attribute that overrides the generated prop name so you
	can remove one layer of aliasing between the control tokens here and the legacy tokens defined in WinUI.

	{control.neutralButton.border.width} = { value: 1 }
	<x:Double x:Key="AliasControlNeutralButtonBorderWidth">1</x:Double>
	<StaticResource x:Key="ButtonBorderThemeThickness" ResourceKey="AliasControlNeutralButtonBorderWidth" />

		-->

	{control.neutralButton.border.width} = { value: 1, attributes: { xamlName: "ButtonBorderThemeThickness" } }
	<x:Double x:Key="ButtonBorderThemeThickness">1</x:Double>
	...and no XAML resource for AliasControlNeutralButtonBorderWidth defined at all.

	Note that this assumes that there's some kind of "master" Fluent JSON that gets merged with updates from the
	plugin and website, or otherwise those sources would need to replicate the same. Alternately, there could just
	be a single mapping dictionary of Fluent token name to WinUI token name that exists only in this pipeline.
*/

const getNameForWinUI = (path, prefix) =>
	_.upperFirst(_.camelCase(getModifiedPathForNaming(path, prefix).join(' ')))

StyleDictionary.registerTransform({
	name: 'fluentui/name/pascal',
	type: 'name',
	transformer: (prop, options) => getNameForWinUI(prop.path, options.prefix),
})

StyleDictionary.registerTransform({
	name: 'fluentui/alias/winui',
	type: 'attribute',
	matcher: (prop) => "resolvedAliasPath" in prop,
	transformer: (prop, options) =>
	{
		return { aliasResourceName: getNameForWinUI(prop.resolvedAliasPath.split("."), options.prefix) }
	},
})

const winuiInvalidFontFamilies = new Set([
	'serif',
	'sans-serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'emoji',
	'math',
	'fangsong',
])

StyleDictionary.registerTransform({
	name: 'fluentui/font/winui',
	type: 'value',
	matcher: (prop) => prop.attributes.category === 'font',
	transformer: (prop, options) =>
	{
		/*
			Transforms a CSS font-family string to one for Microsoft.UI.Xaml.Media.FontFamily.

			"Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif
				-->
			Segoe UI, Roboto, Helvetica Neue, Helvetica, Arial
		*/
		const transformedList = prop.value.split(',').map((family) =>
		{
			const trimmed = family.trim()
			const minusDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.substring(1, trimmed.length - 1) : trimmed
			return minusDoubleQuotes.startsWith("'") && minusDoubleQuotes.endsWith("'")
				? minusDoubleQuotes.substring(1, minusDoubleQuotes.length - 1)
				: minusDoubleQuotes
		})
		if (transformedList.length === 0)
			return ''
		if (winuiInvalidFontFamilies.has(transformedList[transformedList.length - 1]))
			transformedList.pop()
		return transformedList.join(', ')
	},
})

StyleDictionary.registerTransform({
	name: 'fluentui/size/winui',
	type: 'value',
	matcher: (prop) => prop.attributes.category === 'size',
	transformer: (prop, options) =>
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
		if (typeof value === 'number')
			return value.toString()
		else if (value.includes('/'))
			console.warn(`Size values with a slash are not currently supported: "${value}".`)
		else if (Array.isArray(value) && value.length === 4)
			return prop.attributes.xamlType !== 'CornerRadius'
				? `${value[3]}, ${value[0]}, ${value[1]}, ${value[2]}`
				: `${value[0]}, ${value[1]}, ${value[2]}, ${value[3]}`
		else
			console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
	},
})

StyleDictionary.registerTransform({
	name: 'fluentui/color/winui',
	type: 'value',
	matcher: (prop) => prop.attributes.category === 'color',
	transformer: (prop, options) =>
	{
		/*
			Transforms a valid CSS color value into a string for Windows.Foundation.Color.
		*/
		if (prop.value === 'transparent') return 'Transparent'
		const str = Color(prop.value).toHex8()
		return `#${str.slice(6)}${str.slice(0, 6)}`
	},
})

StyleDictionary.registerTransformGroup({
	name: 'fluentui/winui',
	transforms: ['fluentui/attribute', 'fluentui/name/pascal', 'fluentui/alias/winui', 'fluentui/size/winui', 'fluentui/font/winui', 'fluentui/color/winui'],
})

StyleDictionary.registerFormat({
	name: 'fluentui/xaml/res',
	formatter: (dictionary, config) =>
	{
		return `<ResourceDictionary
	xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
	xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

	<!--
		Do not edit this file directly.
		Generated on ${new Date().toUTCString()}
	-->

${dictionary.allProperties.map((prop) =>
		{
			if (prop.attributes.aliasResourceName)	
			{
				return `	<StaticResource x:Key="${prop.name}" ResourceKey="${prop.attributes.aliasResourceName}" />`
			}
			else
			{
				const xamlType = prop.attributes.xamlType || 'x:String'
				return `	<${xamlType} x:Key="${prop.name}">${escapeXml(prop.value)}</${xamlType}>`
			}
		}).join('\n')}

</ResourceDictionary>`
	},
})

// TODO: Set up a watcher so that this can happen automatically in the background.
