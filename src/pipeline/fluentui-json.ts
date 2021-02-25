import StyleDictionary from "style-dictionary"
import _ from "lodash"

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
	transforms: ["fluentui/attribute", "fluentui/name/json/grouped", "fluentui/alias/flatten", "fluentui/color/css"],
})

StyleDictionary.registerFormat({
	name: "fluentui/json/grouped",
	formatter: (dictionary, config) =>
	{
		// Flatten out the token hierarchy and just keep the important bits.
		const sortedProps = Utils.sortPropertiesForReadability(dictionary.allProperties)
		const tokens: any = {}
		let previousProp: any | null = null
		let previousPropRoot: string | null = null
		let thisOutputObject: any | null = null
		for (const thisProp of sortedProps)
		{
			let rootName = _.camelCase(thisProp.path[0])
			let meaningfulPathStart = 1
			if (rootName === "set" && thisProp.path.length > 1)
			{
				meaningfulPathStart = 2
				rootName = _.camelCase(thisProp.path[1])
			}
			if (thisProp.path.length > 2 && thisProp.path[1] === "Base")
			{
				meaningfulPathStart = 2
			}
			meaningfulPathStart = Math.min(meaningfulPathStart, thisProp.path.length - 1)

			if (!previousProp || rootName !== previousPropRoot)
			{
				tokens[rootName] = thisOutputObject = tokens[rootName] || {}
			}

			const exportName = _.camelCase(thisProp.path.slice(meaningfulPathStart).join(" "))
			thisOutputObject[exportName] = thisProp.value

			previousProp = thisProp
			previousPropRoot = rootName
		}

		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})
