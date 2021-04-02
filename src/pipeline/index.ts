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
import "./fluentui-winui"
import "./fluentui-react-demo"

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

	const tokens = {}
	if (typeof input === "string") input = [input]
	input.forEach((inputFile) => _.merge(tokens, jsonfile.readFileSync(inputFile)))

	if (!platforms || platforms.includes("debug")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			debug:
			{
				transformGroup: "js",
				buildPath: `${outputPath}/debug/`,
				files: [{ destination: "tokens-debug.json", format: "json" }],
			}
		}
	)

	if (!platforms || platforms.includes("json")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			json:
			{
				transformGroup: "fluentui/json/grouped",
				buildPath: `${outputPath}/json/`,
				files: [
					{ destination: "tokens-aliases.json", format: "fluentui/json/grouped", filter: "isAlias" },
					{ destination: "tokens-controls.json", format: "fluentui/json/grouped", filter: "isControl" },
				],
			},
		}
	)

	if (!platforms || platforms.includes("reference")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			reference:
			{
				transformGroup: "fluentui/html",
				buildPath: `${outputPath}/reference/`,
				files: [{ destination: "index.html", format: "fluentui/html/reference" }],
			}
		}
	)

	if (!platforms || platforms.includes("ios")) buildOnePlatform(tokens, "ios",
		{
			ios:
			{
				transformGroup: "fluentui/swift",
				buildPath: `${outputPath}/ios/`,
				files: [
					{ destination: "Tokens.swift", format: "ios-swift/class.swift", className: "Tokens" },
					{ destination: "ColorTokens.swift", format: "ios-swift/class.swift", className: "ColorTokens", filter: "isColor" },
					{ destination: "SizeTokens.swift", format: "ios-swift/class.swift", className: "SizeTokens", filter: "isSize" },
					{ destination: "FontTokens.swift", format: "ios-swift/class.swift", className: "FontTokens", filter: "isFont" },
				],
			}
		}
	)

	if (!platforms || platforms.includes("react")) buildOnePlatform(tokens, "css",
		{
			react:
			{
				transformGroup: "fluentui/react",
				buildPath: `${outputPath}/react-theme/src/`,
				files: [
					{ destination: "utils/colors.ts", format: "fluentui/react/colors" },
					{ destination: "global/borderRadius.ts", format: "fluentui/react/radii" },
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
					buildPath: `${outputPath}/web/`,
					files: [{ destination: "tokens.css", format: "css/variables" }],
				},
				cssflat:
				{
					transformGroup: "fluentui/cssflat",
					buildPath: `${outputPath}/web/`,
					files: [{ destination: "tokens-flat.css", format: "css/variables" }],
				}
			}
		)
	}

	if (!platforms || platforms.includes("winui")) buildOnePlatform(tokens, "winui",
		{
			winui:
			{
				transformGroup: "fluentui/winui",
				buildPath: `${outputPath}/winui/`,
				files: [
					{ destination: "Tokens.xaml", format: "fluentui/xaml/res" },
					{ destination: "ThemedTokens.xaml", format: "fluentui/xaml/res/themed" },
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
