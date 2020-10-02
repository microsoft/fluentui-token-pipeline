import _ from "lodash"
import jsonfile from "jsonfile"

import { resolveAliases } from "./fluentui-aliases"
import { buildColorRamps } from "./fluentui-color-ramp"
import { resolveComputedTokens } from "./fluentui-computed"
import { resolvePlatformOverrides } from "./fluentui-platform-overrides"
import "./fluentui-shared"
import "./fluentui-css"
import "./fluentui-html"
import "./fluentui-ios"
import "./fluentui-winui"

// ------------------------------------------------------------
// Configure pipeline input and output here
// ------------------------------------------------------------

/*
	List at least one input JSON file, relative to the root of the repo.

	To see the pipeline merge multiple JSON files together, try adding "src/tokens/example-red-accent.json" to the array.
*/
const inputTokenFiles = ["src/tokens/fluentui.json"]

/*
	Specify the path to where output files should be generated, relative to the root of the repo.
	Additional folders will be included within that one.
*/
const outputPath = "build"

// ------------------------------------------------------------

let tokens = {}
inputTokenFiles.forEach((inputFile) => _.merge(tokens, jsonfile.readFileSync(inputFile)))
tokens = buildColorRamps(tokens)
tokens = resolveAliases(tokens)
tokens = resolveComputedTokens(tokens)
tokens = resolvePlatformOverrides(tokens, "winui") // TODO: move this to be a per-platform transform

module.exports = {
	properties: tokens,

	platforms: {
		debug: {
			transformGroup: "js",
			buildPath: `${outputPath}/debug/`,
			files: [{ destination: "fluentuitokens-debug.json", format: "json" }],
		},

		reference: {
			transformGroup: "fluentui/html",
			buildPath: `${outputPath}/reference/`,
			files: [{ destination: "fluentuitokens.html", format: "fluentui/html/reference" }],
		},

		ios: {
			transformGroup: "fluentui/swift",
			buildPath: `${outputPath}/ios/`,
			files: [
				{ destination: "FluentUITokens.swift", format: "ios-swift/class.swift", className: "FluentUITokens" },
				{ destination: "FluentUIColorTokens.swift", format: "ios-swift/class.swift", className: "FluentUIColorTokens", filter: "isColor" },
				{ destination: "FluentUISizeTokens.swift", format: "ios-swift/class.swift", className: "FluentUISizeTokens", filter: "isSize" },
				{ destination: "FluentUIFontTokens.swift", format: "ios-swift/class.swift", className: "FluentUIFontTokens", filter: "isFont" },
			],
		},

		css: {
			transformGroup: "fluentui/css",
			buildPath: `${outputPath}/web/`,
			files: [{ destination: "fluentuitokens.css", format: "css/variables" }],
		},

		cssflat: {
			transformGroup: "fluentui/cssflat",
			buildPath: `${outputPath}/web/`,
			files: [{ destination: "fluentuitokens-flat.css", format: "css/variables" }],
		},

		winui: {
			transformGroup: "fluentui/winui",
			buildPath: `${outputPath}/winui/`,
			files: [
				{ destination: "FluentUITokens.xaml", format: "fluentui/xaml/res" },
				{ destination: "FluentUITokensThemed.xaml", format: "fluentui/xaml/res/themed" },
			],
		},
	},
}
