import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"
import _ from "lodash"

const constructName = (path: any, prop: any): string =>
{
	let newName = path[0] !== "Global" && prop.attributes.category === "color" ? `color${Utils.pascalCase(path)}` : _.camelCase(path.join(" "))
	newName = newName.replace("Rest", "")
	return newName
}

StyleDictionary.registerTransform({
	name: "dcs/name/json",
	type: "name",
	transformer: prop => `${constructName(Utils.getTokenExportPath(prop), prop)}`,
})

StyleDictionary.registerTransform({
	name: "dcs/alias/json",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${constructName(prop.resolvedAliasPath, prop)})`,
})

StyleDictionary.registerTransform({
	name: "dcs/name/css",
	type: "name",
	transformer: prop => `${constructName(Utils.getTokenExportPath(prop), prop)}`,
})

StyleDictionary.registerTransform({
	name: "dcs/alias/css",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${constructName(prop.resolvedAliasPath, prop)})`,
})

StyleDictionary.registerTransform({
	name: "dcs/name/mixins",
	type: "name",
	transformer: prop => `${constructName(Utils.getTokenExportPath(prop), prop)}`,
})

StyleDictionary.registerTransform({
	name: "dcs/alias/mixins",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${constructName(prop.resolvedAliasPath, prop)})`,
})

StyleDictionary.registerTransformGroup({
	name: "dcs/json",
	transforms: ["dcs/name/json", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css", "fluentui/font/css", "dcs/alias/json"],
})

StyleDictionary.registerTransformGroup({
	name: "dcs/mixins",
	transforms: ["dcs/name/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css", "fluentui/font/css", "dcs/alias/css"],
})

StyleDictionary.registerTransformGroup({
	name: "dcs/css",
	transforms: ["dcs/name/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css", "fluentui/font/css", "dcs/alias/css"],
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
	name: "fluentui/dcs/mixins",
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
		const tokens: any = {}
		for (const thisProp of sortedProps)
		{
			tokens[constructName(thisProp.path, thisProp)] = thisProp.value
		}

		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})
