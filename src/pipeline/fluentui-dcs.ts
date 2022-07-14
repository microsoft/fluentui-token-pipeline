import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"
import _ from "lodash"



const constructJsonName = (path: any[]) => _.camelCase(`${path.join("")}`)

const constructCssName = (path: any[]): string =>
{
	let newName = path[0] !== "Global" && path[3] === "Color" ? `color${path.join("")}` : path.join("")
	newName = newName.charAt(0).toLowerCase() + newName.slice(1)
	newName = newName.replace("NeutralNeutral", "Neutral")
	newName = newName.replace("NeutralBrand", "Brand")
	newName = newName.replace("NeutralCompound", "Compound")
	newName = newName.replace("Rest", "")
	newName = newName.replace("FillColor", "")

	return newName
}


StyleDictionary.registerTransform({
	name: "dcs/name/json",
	type: "name",
	transformer: prop => `${constructJsonName(Utils.getTokenExportPath(prop))}`,
})

StyleDictionary.registerTransform({
	name: "dcs/alias/json",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `${constructJsonName(prop.resolvedAliasPath)}`,
})

StyleDictionary.registerTransform({
	name: "dcs/name/css",
	type: "name",
	transformer: prop => `${constructCssName(Utils.getTokenExportPath(prop))}`,
})

StyleDictionary.registerTransform({
	name: "dcs/alias/css",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${constructCssName(prop.resolvedAliasPath)})`,
})

StyleDictionary.registerTransformGroup({
	name: "dcs/json",
	transforms: ["fluentui/attribute", "dcs/name/json", "dcs/alias/json", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css"],
})

StyleDictionary.registerTransformGroup({
	name: "dcs/css",
	transforms: ["fluentui/attribute", "dcs/name/css", "dcs/alias/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css"],
})

StyleDictionary.registerFormat({
	name: "fluentui/dcs/css",
	formatter: function (dictionary: { allProperties: { name: any; value: any }[] }, config: any)
	{
		return `${this.selector} {
		${dictionary.allProperties.map((prop: { name: any; value: any }) => `  --${prop.name}: ${prop.value};`).join("\n")}
	  }`
	}
})

StyleDictionary.registerFormat({
	name: "fluentui/dcs/json",
	formatter: (dictionary: { allProperties: any[] }) =>
	{
		// Flatten out the token hierarchy and just keep the important bits.
		const sortedProps = Utils.sortPropertiesForReadability(dictionary.allProperties)
		let tokens: any = {}
		let previousProp: any | null = null
		let previousPropRoot: string | null = null
		let previousPropSubgroup: string | null = null
		let thisOutputObject: any | null = null
		for (const thisProp of sortedProps)
		{
			const rootName = _.camelCase(thisProp.path[1])
			const subgroupName: string | null = null


			{
				tokens = thisOutputObject = tokens || {}
				if (subgroupName && !(subgroupName in thisOutputObject))
					thisOutputObject = thisOutputObject[subgroupName] = {}
			}
			let exportName = thisProp.path[0] !== "Global"
				&& thisProp.path[4] === "Color"
				? `color${_.camelCase(thisProp.path.slice(0).join(""))}`
				: _.camelCase(thisProp.path.slice(0).join(""))

			exportName = exportName.replace("NeutralNeutral", "Neutral")
			exportName = exportName.replace("NeutralBrand", "Brand")
			exportName = exportName.replace("NeutralCompound", "Compound")
			exportName = exportName.replace("Rest", "")
			exportName = exportName.replace("set", "")
			exportName = exportName.replace("FillColor", "")
			thisOutputObject[exportName] = thisProp.value
			previousProp = thisProp
			previousPropRoot = rootName
			previousPropSubgroup = subgroupName
		}

		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})

