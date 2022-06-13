import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"

const constructName = (path: any[]): string =>
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
	name: "dcs/name/kebab",
	type: "name",
	transformer: prop => constructName(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransform({
	name: "dcs/alias/css",
	type: "value",
	matcher: prop => "resolvedAliasPath" in prop,
	transformer: prop => `var(--${constructName(prop.resolvedAliasPath)})`,
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/dcs",
	transforms: ["fluentui/attribute", "dcs/name/kebab", "dcs/alias/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css"],
})

StyleDictionary.registerFormat({
	name: "fluentui/dcs",
	formatter: function (dictionary, config)
	{
		return (
			`${this.selector} {
${dictionary.allProperties.map(prop => `  --${prop.name}: ${prop.value};`).join("\n")}
}`)
	}
})
