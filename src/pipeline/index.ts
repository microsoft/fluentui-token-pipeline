import _ from "lodash"
import jsonfile from "jsonfile"

import { SupportedPlatform, SupportedPlatforms } from "./types"
import { resolveAliases } from "./fluentui-aliases"
import { buildColorRamps } from "./fluentui-color-ramp"
import { resolveComputedTokens } from "./fluentui-computed"
import { resolvePlatformOverrides } from "./fluentui-platform-overrides"
import "./fluentui-shared"
import "./fluentui-css"
import "./fluentui-html"
import "./fluentui-json"
import "./fluentui-ios"
import "./fluentui-winui"

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
				files: [{ destination: "fluentuitokens-debug.json", format: "json" }],
			}
		}
	)

	if (!platforms || platforms.includes("json")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			json:
			{
				transformGroup: "fluentui/json/grouped",
				buildPath: `${outputPath}/json/`,
				files: [{ destination: "fluentuitokens-grouped.json", format: "fluentui/json/grouped" }],
			}
		}
	)

	if (!platforms || platforms.includes("reference")) buildOnePlatform(tokens, /* platformOverride: */ null,
		{
			reference:
			{
				transformGroup: "fluentui/html",
				buildPath: `${outputPath}/reference/`,
				files: [{ destination: "fluentuitokens.html", format: "fluentui/html/reference" }],
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
					{ destination: "FluentUITokens.swift", format: "ios-swift/class.swift", className: "FluentUITokens" },
					{ destination: "FluentUIColorTokens.swift", format: "ios-swift/class.swift", className: "FluentUIColorTokens", filter: "isColor" },
					{ destination: "FluentUISizeTokens.swift", format: "ios-swift/class.swift", className: "FluentUISizeTokens", filter: "isSize" },
					{ destination: "FluentUIFontTokens.swift", format: "ios-swift/class.swift", className: "FluentUIFontTokens", filter: "isFont" },
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
					files: [{ destination: "fluentuitokens.css", format: "css/variables" }],
				},
				cssflat:
				{
					transformGroup: "fluentui/cssflat",
					buildPath: `${outputPath}/web/`,
					files: [{ destination: "fluentuitokens-flat.css", format: "css/variables" }],
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
					{ destination: "FluentUITokens.xaml", format: "fluentui/xaml/res" },
					{ destination: "FluentUITokensThemed.xaml", format: "fluentui/xaml/res/themed" },
				],
			}
		}
	)
}

const buildOnePlatform = (tokens: any, platformOverride: SupportedPlatform | null, platformConfig: Record<string, unknown>): void =>
{
	tokens = platformOverride ? resolvePlatformOverrides(_.cloneDeep(tokens), platformOverride) : _.cloneDeep(tokens)
	tokens = buildColorRamps(tokens)
	tokens = resolveAliases(tokens)
	tokens = resolveComputedTokens(tokens)

	require("style-dictionary").extend(
		{
			properties: tokens,
			platforms: platformConfig,
		}
	).buildAllPlatforms()
}
