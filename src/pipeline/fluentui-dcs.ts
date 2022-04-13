import StyleDictionary from "style-dictionary"
import * as Utils from "./utils"

const constructName = (path: any[]): string =>
{
	let newName = path[0] !== "Global" && path[3] === "Color" ? `color${path.join("")}` : path.join("-").toLowerCase()
	newName = newName.replace("NeutralNeutral", "Neutral")
	newName = newName.replace("NeutralBrand", "Brand")
	newName = newName.replace("NeutralCompound", "Compound")
	newName = newName.replace("Rest", "")
	newName = newName.replace("FillColor", "")

	return newName
}

StyleDictionary.registerTransform({
	name: "dcs/kebab",
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
	transforms: ["fluentui/attribute", "dcs/kebab", "dcs/alias/css", "time/seconds", "fluentui/size/css", "fluentui/color/css", "fluentui/strokealignment/css", "fluentui/shadow/css"],
})
