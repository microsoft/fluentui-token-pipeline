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

const getHTMLForToken = (prop) =>
{
	const name = prop.name
	const alias = prop.attributes.aliasResourceName || ""
	const value = Utils.escapeXml(prop.value)

	// TODO: For alias tokens, use the category of the final value

	// TODO: Handle other types of tokens

	switch (prop.attributes.category)
	{
		case "color": return `
	<div class="color swatch" style="background-color: ${value};"></div>
	<div class="name">${name}</div>
	<div class="value">${alias}</div>
	<div class="finalvalue">${value}</div>`

		default: return `
	<div class="swatch"></div>
	<div class="name">${name}</div>
	<div class="value">${alias}</div>
	<div class="finalvalue">${value}</div>`
	}
}

StyleDictionary.registerFormat({
	name: 'fluentui/html/reference',
	formatter: (dictionary, config) =>
	{
		// TODO: Group them by Global, Alias sets, and individual controls

		return `<!DOCTYPE html>
<html lang="en-us">
<head>
<meta charset="utf-8" />
<title>FluentUI style reference</title>
<style type="text/css">
*, *::before, *::after
{
	box-sizing: inherit;
}

html
{
	box-sizing: border-box;
	min-height: 100%;

	font-family: "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 14px;
	font-weight: 400;
	line-height: 20px;
	color: black;
	background-color: white;

	cursor: default;
}

body
{
	color: black;
	padding: 0 2em 2em 2em;
}

code, pre
{
	font-family: Inconsolata, "Cascadia Mono", "Cascadia Mono PL", "Cascadia Code", "Cascadia Code PL", Consolas, SFMono-Regular, monospace;
}

p, h1, h2
{
	margin-block-start: 1em;
	margin-block-end: 1em;
}

h1
{
	font-family: "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 32px;
	font-weight: 600;
	line-height: 40px;
}

h2
{
	font-family: "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 24px;
	font-weight: 600;
	line-height: 32px;
}

h3
{
	font-family: "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 16px;
	font-weight: 600;
	line-height: 24px;
}

.tokentable
{
	display: grid;
	grid-template-columns: [swatch] 32px [name] auto [value] auto [purevalue] auto;
	grid-auto-rows: 32px;
	gap: .25em 1em;
	justify-content: start;
}

.tokentable > h1, .tokentable > h2, .tokentable > h3
{
	grid-column: 1 / -1;
}

.tokentable > *
{
	margin: auto 0;
	overflow: hidden;

	white-space: nowrap;
}

.tokentable > .color.swatch
{
	height: 100%;
}

.tokentable > .text.swatch
{
	color: #404040;
	user-select: none;
}

.tokentable > .value::before, .tokentable > .finalvalue::before
{
	content: " = ";
	color: #808080;
}

.tokentable > .finalvalue
{
	text-overflow: ellipsis;
}

</style>
</head>
<body>

<h1>FluentUI style reference</h1>

<p>Generated on <time datetime="2020-04-20 16:20">${new Date().toUTCString()}</time></p>

<div class="tokentable">

${dictionary.allProperties.map(getHTMLForToken).join('\n')}

</div>

</body></html>`},
})
