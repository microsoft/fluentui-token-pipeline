"use strict"

const StyleDictionary = require("style-dictionary")
const _ = require("lodash")

const Utils = require("./utils")

const getNameForReference = (path, prefix) => Utils.getModifiedPathForNaming(path, prefix).join("-")

StyleDictionary.registerTransform({
	name: "fluentui/name/reference",
	type: "name",
	transformer: (prop, options) => getNameForReference(prop.path, prop.prefix),
})

StyleDictionary.registerTransform({
	name: "fluentui/alias/reference",
	type: "attribute",
	matcher: (prop) => "resolvedAliasPath" in prop,
	transformer: (prop, options) =>
	{
		return { aliasResourceName: getNameForReference(prop.resolvedAliasPath.split("."), options.prefix) }
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/html",
	transforms: ["fluentui/attribute", "fluentui/name/reference", "fluentui/alias/reference"],
})

StyleDictionary.registerFormat({
	name: 'fluentui/html/reference',
	formatter: (dictionary, config) =>
	{
		return `<!DOCTYPE html>
<html>
	<!--
		Generated on ${new Date().toUTCString()}
	-->

	<h1>This page is a work in progress</h1>

${dictionary.allProperties.map((prop) =>
		{
			if (prop.attributes.aliasResourceName)	
			{
				return `<div>${prop.name} = ${prop.attributes.aliasResourceName} = ${Utils.escapeXml(prop.value)}</div>`
			}
			else
			{
				return `<div>${prop.name} = ${Utils.escapeXml(prop.value)}</div>`
			}
		}).join('\n')}

</html>`},
})
