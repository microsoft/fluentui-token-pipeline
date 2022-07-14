import _ from "lodash"
import jsonfile from "jsonfile"

import { SupportedPlatform, SupportedPlatforms, SupportedThemes } from "./types"
import { resolveAliases } from "./fluentui-aliases"
import { resolveGeneratedSets } from "./fluentui-generate"
import { resolveComputedTokens } from "./fluentui-computed"
import { resolvePlatformOverrides } from "./fluentui-platform-overrides"
import "./fluentui-shared"
import "./fluentui-css"
import "./fluentui-html"
import "./fluentui-json"
import "./fluentui-ios"
import "./fluentui-react"
import "./fluentui-reactnative"
import "./fluentui-winui"
import "./fluentui-w3c"
import "./fluentui-dcs"
import "./figmatokens"

export const buildOutputs = (input: string[] | string, outputPath: string, platforms: SupportedPlatform[] | undefined, theme: string | undefined): void =>
{
	if (platforms)
	{
		for (const platform of platforms)
		{
			if (!SupportedPlatforms[platform])
				throw new Error(`Unsupported platform: ${platform}`)
			if (platform.includes("dcs"))
			{
				if (!theme)
				{
					throw new Error(`Please specify a --theme if using the dcs platform ( supported themes: dark, light, hc )`)
				}
				if (!SupportedThemes[theme])
				{
					throw new Error(`Unsupported theme: ${theme} ( supported themes: dark, light, hc )`)
				}
			}
		}
	}


	const useSubfolders = !platforms || platforms.length !== 1

	if (!outputPath.endsWith("/")) outputPath = outputPath + "/"

	const tokens = {}
	if (typeof input === "string") input = [input]
	input.forEach((inputFile) => _.merge(tokens, jsonfile.readFileSync(inputFile)))

	if (!platforms || platforms.includes("debug")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			debug:
			{
				transformGroup: "js",
				buildPath: useSubfolders ? `${outputPath}debug/` : outputPath,
				files: [{ destination: "tokens-debug.json", format: "json" }],
			}
		}
	)

	if (!platforms || platforms.includes("json")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			json:
			{
				transformGroup: "fluentui/json/grouped",
				buildPath: useSubfolders ? `${outputPath}json/` : outputPath,
				files: [
					{ destination: "tokens-global.json", format: "fluentui/json/grouped", filter: "isGlobal" },
					{ destination: "tokens-aliases.json", format: "fluentui/json/grouped", filter: "isAlias" },
					{ destination: "tokens-controls.json", format: "fluentui/json/grouped", filter: "isControl" },
				],
			}
		}
	)

	if (!platforms || platforms.includes("w3c")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			w3c:
			{
				transformGroup: "fluentui/w3c",
				buildPath: useSubfolders ? `${outputPath}w3c/` : outputPath,
				files: [{ destination: "tokens.json", format: "fluentui/w3c" }],
			}
		}
	)

	if (!platforms || platforms.includes("reference")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			reference:
			{
				transformGroup: "fluentui/html",
				buildPath: useSubfolders ? `${outputPath}reference/` : outputPath,
				files: [{ destination: "index.html", format: "fluentui/html/reference" }],
			}
		}
	)

	if (!platforms || platforms.includes("ios")) buildOnePlatform(tokens, "ios",
		{
			ios:
			{
				transformGroup: "fluentui/swift",
				buildPath: useSubfolders ? `${outputPath}ios/` : outputPath,
				files: [
					{ destination: "Tokens.swift", format: "ios-swift/class.swift", className: "Tokens" },
					{ destination: "ColorTokens.swift", format: "ios-swift/class.swift", className: "ColorTokens", filter: "isColor" },
					{ destination: "SizeTokens.swift", format: "ios-swift/class.swift", className: "SizeTokens", filter: "isSize" },
					{ destination: "FontTokens.swift", format: "ios-swift/class.swift", className: "FontTokens", filter: "isFont" },
				],
			}
		}
	)

	if (!platforms || platforms.includes("css"))
	{
		buildOnePlatform(tokens, "css",
			{
				css:
				{
					transformGroup: "fluentui/css",
					buildPath: useSubfolders ? `${outputPath}web/` : outputPath,
					files: [{ destination: "tokens.css", format: "css/variables" }],
				},
				cssflat:
				{
					transformGroup: "fluentui/cssflat",
					buildPath: useSubfolders ? `${outputPath}web/` : outputPath,
					files: [{ destination: "tokens-flat.css", format: "css/variables" }],
				},
				scss:
				{
					transformGroup: "fluentui/scss",
					buildPath: useSubfolders ? `${outputPath}web/` : outputPath,
					files: [{ destination: "tokens.scss", format: "scss/variables" }],
				},
				scssflat:
				{
					transformGroup: "fluentui/scssflat",
					buildPath: useSubfolders ? `${outputPath}web/` : outputPath,
					files: [{ destination: "tokens-flat.scss", format: "scss/variables" }],
				},
			}
		)
	}

	if (!platforms || platforms.includes("react")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			react:
				{
					transformGroup: "fluentui/react",
					buildPath: useSubfolders ? `${outputPath}react/` : outputPath,
					files: [
						{ destination: "global-colors.ts", format: "react/colors/global", filter: "isGlobalColor" },
						{ destination: "alias-colors.ts", format: "react/colors/alias", filter: "isAliasColor" },
					],
				}
		}
	)

	if (!platforms || platforms.includes("reactnative")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			reactnative:
			{
				transformGroup: "fluentui/reactnative",
				buildPath: useSubfolders ? `${outputPath}reactnative/` : outputPath,
				files: [
					{ destination: "tokens-global.json", format: "fluentui/json/grouped", filter: "isGlobalNotShadow" },
					{ destination: "tokens-shadow.json", format: "fluentui/json/grouped", filter: "isGlobalShadow" },
					{ destination: "tokens-aliases.json", format: "fluentui/json/grouped", filter: "isAlias" },
					{ destination: "tokens-controls.json", format: "fluentui/json/grouped", filter: "isControl" },
				],
			}
		}
	)

	if (!platforms || platforms.includes("winui")) buildOnePlatform(tokens, "winui",
		{
			winui:
			{
				transformGroup: "fluentui/winui",
				buildPath: useSubfolders ? `${outputPath}winui/` : outputPath,
				files: [
					{ destination: "Tokens.xaml", format: "fluentui/xaml/res" },
					{ destination: "ThemedTokens.xaml", format: "fluentui/xaml/res/themed" },
				],
			}
		}
	)

	if (!platforms || platforms.includes("figmatokens")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			figmatokens:
			{
				transformGroup: "fluentui/figmatokens",
				buildPath: useSubfolders ? `${outputPath}figmatokens/` : outputPath,
				files: [{ destination: "figmatokens.json", format: "fluentui/figmatokens" }],
			}
		}
	)

	if (!platforms || platforms.includes("dcs")) buildOnePlatform(tokens, "dcs",
		{
			dcsCss:
			{
				transformGroup: "dcs/css",
				buildPath: useSubfolders ? `${outputPath}dcs/` : outputPath,
				files: [
					{ destination: `css/fluent-${theme}-theme.css`, format: "fluentui/dcs/css", selector: `[data-theme="fluent-${theme}"]` },
				],
			},
			dcsJson:
			{
				transformGroup: "dcs/json",
				buildPath: useSubfolders ? `${outputPath}dcs/` : outputPath,
				files: [
					{ destination: `json/fluent-${theme}-theme.json`, format: "fluentui/dcs/json" }
				],
			}
		}
	)
}

const buildOnePlatform = (tokens: any, platformOverride: SupportedPlatform | null, platformConfig: Record<string, unknown>): void =>
{
	tokens = platformOverride ? resolvePlatformOverrides(_.cloneDeep(tokens), platformOverride) : _.cloneDeep(tokens)
	tokens = resolveGeneratedSets(tokens)
	tokens = resolveAliases(tokens)
	tokens = resolveComputedTokens(tokens)

	require("style-dictionary").extend(
		{
			properties: tokens,
			platforms: platformConfig,
		}
	).buildAllPlatforms()
}
