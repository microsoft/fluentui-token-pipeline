import StyleDictionary from "style-dictionary"
import _ from "lodash"

StyleDictionary.registerFilter({
	name: "isGlobalColor",
	matcher: prop =>
	{
		const rootName = prop.path[0]
		return rootName === "Global" && new Set(prop.path).has("Color")
	},
})

StyleDictionary.registerFilter({
	name: "isAliasColor",
	matcher: prop =>
	{
		const rootName = prop.path[0]
		return rootName === "Set" && new Set(prop.path).has("Color")
	},
})

// These are hacks - can we update the input JSON structure to match the expected output?
StyleDictionary.registerTransform({
	name: "fluentui/react/aliasCssVariable",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop =>
	{
		const aliasPath = prop.resolvedAliasPath.map(_.camelCase)
		// var(--global-color-brand-shade-60) -> var(--global-palette-brand-shade60)
		//              ^^^^^            ^                    ^^^^^^^
		if (aliasPath.length === 5
			&& aliasPath[0] === "global"
			&& aliasPath[1] === "color"
			&& aliasPath[2] === "brand"
		)
		{
			return `var(--global-palette-brand-${aliasPath[3]}${aliasPath[4]})`
		}

		// var(--global-color-grey-94) -> var(--global-palette-grey-94)
		//              ^^^^^                          ^^^^^^^
		if (aliasPath.length === 4
			&& aliasPath[0] === "global"
			&& aliasPath[1] === "color"
		)
		{
			return `var(--global-palette-${aliasPath[2]}-${aliasPath[3]})`
		}

		return `var(--${aliasPath.join("-")})`
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/react/globalColorName",
	type: "name",
	matcher: prop => (
		prop.path[0] === "Global"
	),
	transformer: prop =>
	{
		return prop.path.slice(2).map(_.camelCase).join(".")
	},
})

StyleDictionary.registerTransform({
	name: "fluentui/react/aliasColorName",
	type: "name",
	matcher: prop => (
		prop.path[0] === "Set"
	),
	transformer: prop =>
	{
		let suffix = prop.path[prop.path.length - 1]
		if (suffix === "Rest")
		{
			suffix = ""
		}
		return `${_.camelCase(prop.path[1])}.${_.camelCase(prop.path[2])}${suffix}`
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/react",
	transforms: [
		"fluentui/name/kebab",
		"fluentui/react/aliasCssVariable",
		"fluentui/react/globalColorName",
		"fluentui/react/aliasColorName",
	],
})

const globalColorTypes = {
	"grey": "Record<Greys, string>"
}

StyleDictionary.registerFormat({
	name: "react/colors/global",
	formatter: (dictionary, config) =>
	{
		const colors: any = {}
		dictionary.allProperties.forEach(prop =>
		{
			_.setWith(colors, prop.name, prop.value, Object)
		})

		// No brand
		delete colors.brand

		const sharedColorNames: string[] = []
		return [
			"import type { GlobalSharedColors, ColorVariants, Greys } from '../types';",
			"",
			...Object.keys(colors).map(colorName =>
			{
				if (colors[colorName].shade50 && !colors[colorName].shade60)
				{
					sharedColorNames.push(colorName)
					return `const ${colorName}: ColorVariants = ${JSON.stringify(colors[colorName], null, 2)}`
				}
				const type = globalColorTypes[colorName] ? `: ${globalColorTypes[colorName]}` : ""
				return `export const ${colorName}${type} = ${JSON.stringify(colors[colorName], null, 2)}`
			}),
			`export const sharedColors: GlobalSharedColors = {
${sharedColorNames.join(",\n")}
}`
		].join("\n\n")
	},
})

const firstCharToLowerCase = (input: string): string =>
{
	return input[0].toLowerCase() + input.slice(1)
}

const firstCharToUpperCase = (input: string): string =>
{
	return input[0].toUpperCase() + input.slice(1)
}

const aliasPathToGlobalImport = (resolvedAliasPath: string[], imports: Set<string>): string =>
{
	if (resolvedAliasPath.length < 3 || resolvedAliasPath[0] !== "Global" || resolvedAliasPath[1] !== "Color")
	{
		throw new Error(`Unexpected resolved alias path ${resolvedAliasPath.join(".")}`)
	}

	const exportName = firstCharToLowerCase(resolvedAliasPath[2])

	switch (exportName)
	{
		case "brand":
			return `brand.${resolvedAliasPath[3].toLowerCase()}${resolvedAliasPath[4] || ""}`
		case "grey":
			imports.add(exportName)
			return `grey[${resolvedAliasPath[3]}]`
		default:
			if (resolvedAliasPath.length !== 3)
			{
				throw new Error(`Unexpected resolved color alias path ${resolvedAliasPath.join(".")}`)
			}
			imports.add(exportName)
			return exportName
	}
}

StyleDictionary.registerFormat({
	name: "react/colors/alias",
	formatter: (dictionary, config) =>
	{
		const colors: any = { neutral: {} }
		dictionary.allProperties.forEach(prop =>
		{
			_.setWith(colors, prop.name, prop, Object)
		})

		const imports = new Set<string>()

		const colorTokens = Object.keys(colors.neutral).map(colorName =>
		{
			const prop = colors.neutral[colorName]
			const value = prop.resolvedAliasPath
				? aliasPathToGlobalImport(prop.resolvedAliasPath, imports)
				: `'${prop.value}'`

			return `\tcolor${firstCharToUpperCase(colorName)}: ${value}, // ${prop.original.value} ${
				prop.resolvedAliasPath && prop.resolvedAliasPath.join(".")
			}`
		})

		return [
			`import { ${Array.from(imports).sort().join(", ")}, sharedColors } from '../global/colors';`,
			"import type { BrandVariants, GlobalSharedColors, ColorTokens, ColorPaletteTokens } from '../types';",
			"",
			"export const generateColorTokens = (brand: BrandVariants): ColorTokens => ({",
			...colorTokens,
			"});",
		].join("\n")
	},
})
