"use strict"

const StyleDictionary = require("style-dictionary")
const _ = require("lodash")

const Utils = require("./utils")

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
				sdAttributes = Utils.getSDAttributes(prop.path[1], prop.path[2])
				if (sdAttributes) return sdAttributes
			}
			sdAttributes = Utils.getSDAttributes(undefined, prop.path[1])
			if (sdAttributes) return sdAttributes
		}
		else
		{
			sdAttributes = Utils.getSDAttributes(prop.path[2], prop.path[3])
			if (sdAttributes) return sdAttributes
		}

		console.log(`ERROR: Unable to determine data type based on token name "${prop.path.join('.')}".`)
	},
})
