import _ from "lodash"
import jsonfile from "jsonfile"

import { SupportedPlatform, SupportedPlatforms } from "./types"
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
import "./fluentui-trident"

export const buildOutputs = (input: string[] | string, outputPath: string, platforms: SupportedPlatform[] | undefined): void =>
{
	if (platforms)
	{
		for (const platform of platforms)
		{
			if (!SupportedPlatforms[platform])
				throw new Error(`Unsupported platform: ${platform}`)
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

	if (!platforms || platforms.includes("reactnative")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			reactnative:
			{
				transformGroup: "fluentui/reactnative",
				buildPath: useSubfolders ? `${outputPath}reactnative/` : outputPath,
				files: [
					{ destination: "tokens-global.json", format: "fluentui/json/grouped", filter: "isGlobal" },
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

	if (!platforms || platforms.includes("react")) buildOnePlatform(tokens, null,
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
	if (platforms && platforms.includes("trident"))
	{
		buildOnePlatform(tokens, "trident",
			{
				css:
				{
					transformGroup: "fluentui/css",
					buildPath: useSubfolders ? `${outputPath}tokens/` : outputPath,
					files: [{ destination: "theme.css", format: "css/variables" }],
				},
			}
		)
	}
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
