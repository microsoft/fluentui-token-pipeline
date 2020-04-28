"use strict"

const _ = require("lodash")

const FluentUIAliases = require("./fluentui-aliases")
require("./fluentui-shared")
require("./fluentui-css")
require("./fluentui-html")
require("./fluentui-ios")
require("./fluentui-winui")

// ------------------------------------------------------------
// Configure pipeline input and output here
// ------------------------------------------------------------

/*
	List at least one input JSON file, relative to config.js, not the root of the repo.

	To see the pipeline merge multiple JSON files together, try adding "../tokens/example-red-accent.json" to the array.
*/
const inputTokenFiles = ["../tokens/fluentui.json"]

/*
	Specify the path to where output files should be generated, relative to the root of the repo.
	Additional folders will be included within that one.
*/
const outputPath = "./build/"

// ------------------------------------------------------------

const tokens = {}
inputTokenFiles.forEach((inputFile) => _.merge(tokens, require(inputFile)))

module.exports = {
	properties: FluentUIAliases.resolveAliases(tokens),
	platforms: {
		debug: {
			transformGroup: "js",
			buildPath: outputPath,
			files: [{ destination: "debug/fluentuitokens-debug.json", format: "json" }],
		},

		reference: {
			transformGroup: "fluentui/html",
			buildPath: outputPath,
			files: [{ destination: "reference/fluentuitokens.html", format: "fluentui/html/reference" }],
		},

		ios: {
			transformGroup: 'fluentui/swift',
			// buildPath to change files directly in fluentUI-tokens-demo iOS app ..//fluentUI-tokens-demo/FluentUITokensDemo/Common/Styles/
			buildPath: outputPath,
			files: [
				{ destination: 'FluentUITokens.swift', format: 'ios-swift/class.swift', className: 'FluentUITokens' },
				{ destination: 'FluentUIColorTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUIColorTokens', filter: 'isColor' },
				{ destination: 'FluentUISizeTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUISizeTokens', filter: 'isSize' },
				{ destination: 'FluentUIFontTokens.swift', format: 'ios-swift/class.swift', className: 'FluentUIFontTokens', filter: 'isFont' },
			],
		},

		css: {
			transformGroup: "fluentui/css",
			buildPath: outputPath,
			files: [{ destination: "web/fluentuitokens.css", format: "css/variables" }],
		},

		cssflat: {
			transformGroup: "fluentui/cssflat",
			buildPath: outputPath,
			files: [{ destination: "web/fluentuitokens-flat.css", format: "css/variables" }],
		},

		winui: {
			transformGroup: "fluentui/winui",
			buildPath: outputPath,
			files: [{ destination: "winui/FluentUITokens.xaml", format: "fluentui/xaml/res" }],
		},
	},
}

// TODO: Set up a watcher so that this can happen automatically in the background.
