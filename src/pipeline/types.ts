export type TokenJson = TokenSet & HasMeta

interface HasMeta
{
	Meta: TokenJsonMeta
}

export interface TokenJsonMeta
{
	FluentUITokensVersion: 0
}

export type TokenSet = (TokenSetChildren & TokenSetProperties) | TokenGeneratedSet

export interface TokenSetProperties
{
	/** @deprecated */
	IntendedFor?: string
}

export interface TokenSetChildren
{
	[name: string]: TokenSet | Token
}

export interface TokenGeneratedSet
{
	generate: TokenGenerationProperties
}

export interface TokenGenerationProperties
{
	type: TokenGenerationType
	value: string
}

export const TokenGenerationTypes =
{
	lightness2to98by2: true,
	fluentsharedcolors: true,
	alpha5to90: true,
}
export type TokenGenerationType = keyof typeof TokenGenerationTypes

export type Token = ValueToken | AliasToken | ComputedToken

export interface BaseToken
{
	platform?: TokenPlatformOverrides
	fullName?: string
}

export interface ValueToken extends BaseToken
{
	value: string | number | boolean | number[] | Gradient
}

export interface AliasToken extends BaseToken
{
	aliasOf: string
}

export interface ComputedToken extends BaseToken
{
	computed: TokenComputation
}

export type TokenComputation = TokenColorComputation

export interface TokenColorComputation
{
	color: string
	opacity: number
}

export interface Gradient
{
	start: [x: number, y: number]
	end: [x: number, y: number]
	stops: ({ position: number } & ValueToken)[]
	stopsUnits: "pixels" | undefined
}

export type TokenPlatformOverrides = Partial<SupportedPlatformList<TokenSetChildren>>

export const SupportedPlatforms =
{
	debug: true,
	json: true,
	reference: true,
	w3c: true,
	css: true,
	cssflat: true,
	ios: true,
	react: true,
	reactnative: true,
	winui: true,
	figmatokens: true,
	dcs: true,
}
export type SupportedPlatform = keyof typeof SupportedPlatforms
export type SupportedPlatformList<ValueType> =
{
	[platform in SupportedPlatform]: ValueType
}

export const SupportedThemes =
{
	light: true,
	dark: true,
	hc: true,
}
export type SupportedThemes = keyof typeof SupportedThemes
export type SupportedThemesList<ValueType> =
{
	[theme in SupportedThemes]: ValueType
}

// ------------------------------------------------------------

// Uncomment this and paste the contents of your token JSON to validate it:
// const validate: TokenJson =
