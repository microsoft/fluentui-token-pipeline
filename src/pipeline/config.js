"use strict"

const FluentUIAliases = require("./fluentui-aliases")
require("./fluentui-shared")
require("./fluentui-css")
require("./fluentui-html")
require("./fluentui-winui")

// TODO: Support merging an arbitrary number of token files before the transformation

const tokensInput = "../tokens/fluentui.json"
const buildPath = "./build/"

module.exports = {
	properties: FluentUIAliases.resolveAliases(require(tokensInput)),
	platforms: {
		debug: {
			transformGroup: "js",
			buildPath: buildPath,
			files: [{ destination: "debug/fluentuitokens-debug.json", format: "json" }],
		},

		reference: {
			transformGroup: "fluentui/html",
			buildPath: buildPath,
			files: [{ destination: "reference/fluentuitokens.html", format: "fluentui/html/reference" }],
		},

		css: {
			transformGroup: "fluentui/css",
			buildPath: buildPath,
			files: [{ destination: "web/fluentuitokens.css", format: "css/variables" }],
		},

		cssflat: {
			transformGroup: "fluentui/cssflat",
			buildPath: buildPath,
			files: [{ destination: "web/fluentuitokens-flat.css", format: "css/variables" }],
		},

		winui: {
			transformGroup: "fluentui/winui",
			buildPath: buildPath,
			files: [{ destination: "winui/FluentUITokens.xaml", format: "fluentui/xaml/res" }],
		},
	},
}

// ------------------------------------------------------------

// TODO: iOS Swift output will want each control's constants to go into a separate file, so that controls can be
// shipped as independent packages.
