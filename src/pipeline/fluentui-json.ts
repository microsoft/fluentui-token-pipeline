import StyleDictionary from "style-dictionary"
import _ from "lodash"

import { TokenSet } from "./types"
import * as Utils from "./utils"

// This name is only used for sorting; we don't use it in output.
const nameForGroupedJson = path => path.join("")

StyleDictionary.registerTransform({
	name: "fluentui/name/json/grouped",
	type: "name",
	transformer: prop => nameForGroupedJson(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/json/grouped",
	transforms: ["fluentui/attribute", "fluentui/name/json/grouped"],
})

StyleDictionary.registerFormat({
	name: "fluentui/json/grouped",
	formatter: (dictionary, config) =>
	{
		// Flatten out the token hierarchy and just keep the important bits.
		const sortedProps = Utils.sortPropertiesForReadability(dictionary.allProperties)
		const tokens: any = {}
		let previousProp: any | null = null
		let thisOutputObject: any | null = null
		for (const thisProp of sortedProps)
		{
			if (thisProp.path[0] === "Global" || thisProp.path[0] === "Set") continue

			if (!previousProp || thisProp.path[0] !== previousProp.path[0])
			{
				const controlName = _.camelCase(thisProp.path[0])
				tokens[controlName] = thisOutputObject = tokens[controlName] || {}
			}

			const meaningfulPathStart = (thisProp.path.length > 2 && thisProp.path[1] === "Base") ? 2 : 1
			const exportName = _.camelCase(thisProp.path.slice(meaningfulPathStart).join(" "))
			thisOutputObject[exportName] = thisProp.value

			previousProp = thisProp
		}

		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})
