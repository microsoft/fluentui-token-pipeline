import jsonfile from "jsonfile"
import { Token, TokenJson, TokenSet } from "./types"

export const loadTokensFile = (inputFile: string): TokenSet =>
{
	const tokens: TokenJson = jsonfile.readFileSync(inputFile)
	if (typeof (tokens) !== "object")
	{
		throw new Error(`${inputFile} is not a valid token file.`)
	}

	if ("Meta" in tokens)
	{
		if (tokens.Meta.FluentUITokensVersion !== 0)
		{
			throw new Error(`${inputFile} is a token file but in unsupported version ${JSON.stringify(tokens.Meta.FluentUITokensVersion)}.`)
		}
		// This is a proprietary tokens file that this tool knows how to transform.
		return tokens
	}
	else
	{
		// Our best guess is that this is a W3C-format tokens file, so convert it into our format first so the existing code works as-is.
		return convertW3CTokens(tokens)
	}
}

const convertW3CTokens = (tokens: any): TokenJson =>
{
	// Note that this function isn't intended to be able to fully round-trip tokens back and forth between the W3C format;
	// it's just intended to be "good enough" to allow our existing code to continue working with W3C-format token files.
	// This is a lossy process! Think "compatibility shim," not "spec-compliant parser."

	const converted: any = { Meta: { FluentUITokensVersion: 0 } }
	for (const childName in tokens)
	{
		if (isReservedW3CName(childName)) continue
		if (!tokens.hasOwnProperty(childName)) continue

		if (childName === "Global")
		{
			convertAndCopyTokens(tokens.Global, converted.Global = {})
		}
		else
		{
			// Anything that's not in the Global namespace gets "Set." prepended to the name so that existing code that assumes
			// that word will be there will continue working.
			if (!("Set" in converted)) converted.Set = {}
			convertAndCopyTokens(tokens[childName], converted.Set[childName] = {})
		}
	}
	return converted as TokenJson
}

const convertAndCopyTokens = (from: any, to: TokenSet): void =>
{
	for (const childName in from)
	{
		if (isReservedW3CName(childName)) continue
		if (!from.hasOwnProperty(childName)) continue
		const w3cToken = from[childName]
		if (isToken(w3cToken))
		{
			to[childName] = getConvertedToken(w3cToken)
		}
		else if (isTokenGroup(w3cToken))
		{
			if (childName in to) throw new Error(`Oops, there was already a set called "${childName}"... that shouldn't have happened!`)
			convertAndCopyTokens(w3cToken, to[childName] = {})
		}
		else
		{
			throw new Error(`Unexpected ${typeof w3cToken} child "${childName}" found.`)
		}
	}
}

const getConvertedToken = (w3cToken: Record<string, any>): Token =>
{
	let value = w3cToken.$value
	let attributes: any = { w3cType: w3cToken.$type }
	const aliasTarget = getW3CAliasTargetName(value)
	const converted: any = aliasTarget ? { aliasOf: aliasTarget } : {}

	switch (w3cToken.$type)
	{
		case undefined:
			throw new Error(`Token missing required $type: ${JSON.stringify(w3cToken)}`)
		case "color":
			if ("$extensions" in w3cToken && "com.microsoft.systemcolor" in w3cToken.$extensions)
			{
				value = w3cToken.$extensions["com.microsoft.systemcolor"]
			}
			attributes = { category: "color", figmaTokensType: "color", xamlType: "SolidColorBrush" }
			break
		case "dimension":
			value = parseFloat(value)
			attributes = { category: "size", figmaTokensType: "sizing", xamlType: "x:Double" }
			break
		case "fontFamily":
			if (Array.isArray(value)) value = JSON.stringify(value).slice(1, -1)
			attributes = { category: "font", figmaTokensType: "fontFamilies", xamlType: "FontFamily" }
			break
		case "fontSize":
			value = parseFloat(value)
			attributes = { category: "size", figmaTokensType: "fontSizes", xamlType: "x:Double" }
			break
		case "fontWeight":
			value = parseInt(value, 10)
			attributes = { category: "fontWeight", figmaTokensType: "fontWeight", xamlType: "x:Double" }
			break
		case "shadow":
			if (!Array.isArray(value)) value = [value]
			value = value.map(shadow =>
			{
				// [] isn't actual valid aliasing syntax, but Style Dictionary doesn't let us export strings with {} so we support both.
				const first = shadow.color.charCodeAt(0)
				const color = (first === 123 /* "{" */ || first === 91 /* "[" */) ? { aliasOf: shadow.color.slice(1, -1) } : { value: shadow.color }
				return {
					color: color,
					x: parseFloat(shadow.offsetX),
					y: parseFloat(shadow.offsetY),
					blur: parseFloat(shadow.blur),
				}
			})
			attributes = { category: "shadow", figmaTokensType: "shadow", xamlType: "none" }
			break
		default:
			throw new Error(`Token had an unsupported $type: ${w3cToken.$type}`)
	}

	if (!aliasTarget) converted.value = value
	converted.attributes = attributes
	return converted as unknown as Token
}

const isReservedW3CName = (key: string): boolean =>
{
	return key.charCodeAt(0) === 36 /* "$" */
}

const isToken = (obj: any): boolean =>
{
	return typeof obj === "object" && "$value" in obj
}

const isTokenGroup = (obj: any): boolean =>
{
	return typeof obj === "object" && !("$value" in obj)
}

const getW3CAliasTargetName = (value: any): string | null =>
{
	if (typeof value === "string" && value.charCodeAt(0) === 123 /* "{" */ && value.charCodeAt(value.length - 1) === 125 /* "}" */)
		return value.slice(1, -1)
	else return null
	// REVIEW: Do we need to re-add "Set." here?
}
