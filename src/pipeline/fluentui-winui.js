"use strict"

const StyleDictionary = require("style-dictionary")
const Color = require("tinycolor2")
const _ = require("lodash")

const Utils = require("./utils")

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
	_.upperFirst(_.camelCase(Utils.getModifiedPathForNaming(path, prefix).join(' ')))

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
				return `	<${xamlType} x:Key="${prop.name}">${Utils.escapeXml(prop.value)}</${xamlType}>`
			}
		}).join('\n')}

</ResourceDictionary>`
	},
})
