export type TokenJson = TokenSet & HasMeta

interface HasMeta
{
	Meta: TokenJsonMeta
}

export interface TokenJsonMeta
{
	FluentUITokensVersion: 0
}

export type TokenSet = TokenSetChildren & TokenSetProperties

export interface TokenSetProperties
{
	IntendedFor?: string
}

export interface TokenSetChildren
{
	[name: string]: TokenSet | Token
}

export type Token = ValueToken | AliasToken | ComputedToken

export interface BaseToken
{
	platform?: TokenPlatformOverrides
	fullName?: string
}

export interface ValueToken extends BaseToken
{
	value: string | number | boolean | number[]
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

export interface TokenPlatformOverrides
{
	winui?: TokenSetChildren
}

export type SupportedPlatform = keyof TokenPlatformOverrides

// ------------------------------------------------------------

// Uncomment this and paste the contents of your token JSON to validate it:
// const validate: TokenJson =
