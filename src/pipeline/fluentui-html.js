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
	let swatch

	// Future: Handle other types of tokens

	switch (prop.attributes.aliasCategory || prop.attributes.category)
	{
		case "color":
			if (value === "transparent" || value === "rgba(0, 0, 0, 0)")
				swatch = `<div class="transparent color swatch"></div>`
			else if (value === "white" || value === "#ffffff")
				swatch = `<div class="color swatch" style="background-color: ${value}; border: 1px solid #dddddd;"></div>`
			else
				swatch = `<div class="color swatch" style="background-color: ${value};"></div>`
			break

		default:
			swatch = `<div class="swatch"></div>`
	}

	return `	${swatch}
	<div class="name">${name}</div>
	<div class="value">${alias}</div>
	<div class="finalvalue">${value}</div>

`
}

StyleDictionary.registerFormat({
	name: 'fluentui/html/reference',
	formatter: (dictionary, config) =>
	{
		const sortedProps = Utils.sortPropertiesForReadability(dictionary.allProperties)

		// Turn a sorted list of all tokens into HTML, and inject headers as appropriate.
		let list = ""
		let previousProp = null
		for (const thisProp of sortedProps)
		{
			// See if we need to add a header first. (This logic requires the list to already be sorted.)
			let header = null
			if (thisProp.path[0] === "Global" && (!previousProp))
			{
				header = "<h1>Global tokens</h1>\n\n"
			}
			else if (thisProp.path[0] === "Set" && (!previousProp || previousProp.path[0] !== "Set"))
			{
				header = "<h1>Alias tokens</h1>\n\n"
			}
			else if (thisProp.path[0] !== "Global" && thisProp.path[0] !== "Set" && (!previousProp || previousProp.path[0] === "Global" || previousProp.path[0] === "Set"))
			{
				header = "<h1>Control tokens</h1>\n\n"
			}

			if (thisProp.path[0] === "Set" && (!previousProp || thisProp.path[1] !== previousProp.path[1]))
			{
				header = (header || "") + `<h2>Set-${thisProp.path[1]}</h2>\n\n`
			}
			else if (thisProp.path[0] !== "Global" && thisProp.path[0] !== "Set" && (!previousProp || thisProp.path[0] !== previousProp.path[0]))
			{
				header = (header || "") + `<h2>${thisProp.path[0]}</h2>\n\n`
			}

			if (header)
			{
				if (previousProp) list += "</div>\n\n"
				list += header
				list += "<div class=\"tokentable\">\n\n"
			}

			if (thisProp.path[0] !== "Global" && thisProp.path[0] !== "Set" && (!previousProp || thisProp.path[1] !== previousProp.path[1]))
			{
				// The H3-level headers inside of the control token tables (such as "Root" for "Button-Root-Fill-Color-Rest")
				// go INSIDE the table.
				list += `<h3>${thisProp.path[1]}</h3>\n\n`
			}

			previousProp = thisProp

			// Add this one to the list and then continue.
			list += getHTMLForToken(thisProp)
		}
		if (previousProp) list += "</div>\n\n"

		// Finally, plug that all into the template page and return.
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
	grid-template-columns: [swatch] 32px [name] auto [alias] auto [value] 1fr;
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
	text-overflow: ellipsis;
}

.tokentable > .color.swatch
{
	height: 100%;
}

.tokentable > .transparent.color.swatch
{
	background-position: 0px 0px, 8px 8px;
	background-size: 16px 16px;
	background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee 100%),linear-gradient(45deg, #eee 25%, white 25%, white 75%, #eee 75%, #eee 100%);
}

.tokentable > .text.swatch
{
	color: #404040;
	user-select: none;
}

.tokentable > .value:not(:empty)::before, .tokentable > .finalvalue::before
{
	content: " = ";
	color: #808080;
}

.tokentable > .finalvalue
{
	font-family: Inconsolata, Consolas, SFMono-Regular, monospace;
}

</style>
</head>
<body>

<h1>FluentUI style reference</h1>

<p>Generated on <time datetime="2020-04-20 16:20">${new Date().toUTCString()}</time></p>

${list}

</body></html>`},
})
