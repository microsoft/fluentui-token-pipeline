import StyleDictionary from "style-dictionary"
import _ from "lodash"

import * as Utils from "./utils"
import { colorTokenToHexColor } from "./fluentui-css"

// This name is only used for sorting; we don't use it in output.
const nameForGroupedJson = path => path.join(".")

StyleDictionary.registerTransform({
	name: "fluentui/name/json/grouped",
	type: "name",
	transformer: prop => nameForGroupedJson(Utils.getTokenExportPath(prop)),
})

StyleDictionary.registerTransform({
	name: "fluentui/shadow/json",
	type: "value",
	matcher: prop => prop.attributes.category === "shadow",
	transformer: prop =>
	{
		return prop.value.map(shadow => ({ ...shadow, color: colorTokenToHexColor(shadow.color) }))
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/json/grouped",
	transforms: ["fluentui/name/json/grouped", "fluentui/alias/flatten", "fluentui/color/css", "fluentui/shadow/json"],
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
		let previousPropSubgroup: string | null = null
		let thisOutputObject: any | null = null
		for (const thisProp of sortedProps)
		{
			let rootName: string | null = _.camelCase(thisProp.path[0])
			let subgroupName: string | null = null
			let meaningfulPathStart = 1
			if (rootName === "global" && thisProp.path.length > 3)
			{
				meaningfulPathStart = 3
				rootName = _.camelCase(thisProp.path[1])
				subgroupName = _.camelCase(thisProp.path[2])
			}
			else if ((rootName === "set" || rootName === "global") && thisProp.path.length > 2)
			{
				meaningfulPathStart = 2
				rootName = _.camelCase(thisProp.path[1])
			}
			else if (rootName === "global" && thisProp.path.length === 2)
			{
				meaningfulPathStart = 1
				rootName = null
			}
			if (thisProp.path.length > 2 && thisProp.path[1] === "Base")
			{
				meaningfulPathStart = 2
			}

			if (!previousProp || rootName !== previousPropRoot || subgroupName !== previousPropSubgroup)
			{
				if (rootName)
				{
					tokens[rootName] = thisOutputObject = tokens[rootName] || {}
					if (subgroupName && !(subgroupName in thisOutputObject))
						thisOutputObject = thisOutputObject[subgroupName] = {}
				}
				else
				{
					thisOutputObject = tokens
				}
			}

			const exportName = _.camelCase(thisProp.path.slice(meaningfulPathStart).join(" "))
			thisOutputObject[exportName] = thisProp.value

			previousProp = thisProp
			previousPropRoot = rootName
			previousPropSubgroup = subgroupName
		}

		return JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")
	},
})
