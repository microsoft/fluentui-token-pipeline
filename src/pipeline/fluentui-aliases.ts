import * as Utils from "./utils"
import { Token, TokenSet, AliasToken, ValueToken } from "./types"

/// Resolves all of the aliases in an entire Style Dictionary properties object, and then returns the same object
/// instance, modified.
export const resolveAliases = (properties: TokenSet): TokenSet =>
{
	// Okay, buckle in, cupcake: we're gonna traverse this whole properties tree and find every alias token in the bunch.
	// (Note that we're only looking for Fluent UI aliases, not Style Dictionary aliases.)
	const resolver = (prop: Token | TokenSet, path: string[]) =>
	{
		if (resolveAlias(prop as any, properties))
		{
			if ("aliasOf" in prop)
				Utils.reportError(`resolveAlias failed to resolve ${path.join(".")} -- skipping to prevent infinite recursion.`)
			else
				Utils.forEachRecursive(prop as any, resolver, { requiredChild: "aliasOf" })
		}
	}
	Utils.forEachRecursive(properties, resolver, { requiredChild: "aliasOf" })

	// Then, we just return the same object that was passed in, but modified.
	return properties
}

/// Resolves an alias, replacing the reference with something useful.
const resolveAlias = (prop: Token, properties: TokenSet): AliasToken | null =>
{
	// First, verify that this alias is valid. We only support aliasing with a single string right now.
	// (In the future, we could use aliasOf: { target: "Token.Name", options... }, or aliasOf: [...].)
	if (typeof prop !== "object" || !("aliasOf" in prop))
		throw new Error("Method was called on a property that wasn't an alias of anything.")
	if (typeof prop.aliasOf !== "string")
	{
		Utils.setErrorValue(prop, "Invalid aliasOf syntax", `Invalid aliasOf: ${JSON.stringify(prop.aliasOf)}. The aliasOf property should be a dot-delimited path to another token to refer to, such as "Global.Color.Blue".`)
		return null
	}

	// You can't use aliasOf and value at the same time.
	if ("value" in prop)
	{
		Utils.reportError(`aliasOf: ${JSON.stringify((prop as AliasToken).aliasOf)} was used along with value ${JSON.stringify((prop as ValueToken).value)}, so the alias was ignored.`)
	}

	// Let's find what the alias is targeting. It could be a single token, or a whole set.
	const target = Utils.findPropByPath(prop.aliasOf, properties)
	if (target === null)
	{
		Utils.setErrorValue(prop, `token ${JSON.stringify(prop.aliasOf)} missing`, `Invalid aliasOf: ${JSON.stringify(prop.aliasOf)}. That token doesn't exist.`)
		return null
	}

	if (hasCircularReferences(prop, target, properties))
	{
		Utils.setErrorValue(prop, `circular reference involving ${JSON.stringify(prop.aliasOf)}`, `Invalid aliasOf: ${JSON.stringify(prop.aliasOf)} is in a chain of circular references.`)
		return null
	}

	// Okay, it's a good alias! Merge this property with a deep clone of the alias target.
	mergeProps(prop, target, prop.aliasOf, properties)

	// Return the resolved property to indicate that we successfully resolved the alias.
	return target as AliasToken
}

/// Deep-clones a target property's contents onto an alias property. Values already existing on the alias property are not overwritten.
/// After this method, the property will no longer be an alias.
const mergeProps = (prop: Token, target: Token | TokenSet, targetPath: string, properties: TokenSet) =>
{
	console.assert(
		typeof target === "object",
		"This function assumes that the target is always an object, often of the form { value: 123 }.")

	// This property will be resolved when this method finishes, so remove the alias reference.
	// (We save the path in resolvedAliasPath so that we can use it for output formatting.)
	const propAsAny = prop as any
	delete propAsAny.aliasOf

	// First of all, figure out what the target is.
	// prop = { aliasOf: "target" }
	if (typeof target === "object")
	{
		if ("value" in target)
		{
			// The alias target is a simple value. Easy!
			// target = { value: 123 }
			propAsAny.value = target.value
			propAsAny.resolvedAliasPath = Utils.getTokenExportPath(target as Token, targetPath)
		}
		else if ("aliasOf" in target)
		{
			// The alias target is another alias, so it's recursion time.
			// target = { aliasOf: "targetoftarget" }
			resolveAlias(target as AliasToken, properties)
		}
		else if ("computed" in target)
		{
			// The alias target is a computed token, which will be resolved later.
			// Nothing ever changes the contents of a "computed" node so we don't bother making a deep copy.
			propAsAny.computed = target.computed
		}
		else
		{
			// The alias target is a set, so we need to iterate through keys.
			// target = { A: { value: 1 }, B: { value: 2 }, C: { aliasOf: "targetoftarget" }, D: { D1: ..., D2: ... } }
			for (const key in target)
			{
				if (!target.hasOwnProperty(key)) continue

				const targetProp = target[key]
				// targetProp = { value: 1 } or { aliasOf: "targetoftarget" } or { D1: ..., H2: ... }
				if (typeof targetProp === "object")
				{
					// target.key is another value or alias, so recurse.
					if (!(key in prop)) prop[key] = {}
					mergeProps(prop[key], targetProp, `${targetPath}.${key}`, properties)
				}
			}
		}
	}
	else
	{
		// The target isn't a value, alias, or set, so it must be metadata or something else that we don't need to copy.
		console.log(`Skipping from target: ${targetPath}, because we're not sure what ${JSON.stringify(target)} is`)
	}
}

/// Returns true if there are circular references in a chain of aliases.
const hasCircularReferences = (original: AliasToken, target: Token | TokenSet, properties: TokenSet): boolean =>
{
	// Do a couple of quick checks before doing any expensive work.
	if (original === target) return true
	if (typeof target !== "object") return false
	if (!("aliasOf" in target)) return false

	const traversed = [original]
	let current: AliasToken | null = target as AliasToken
	while (current)
	{
		if (!("aliasOf" in current)) return false
		traversed.push(current)

		current = Utils.findPropByPath(current.aliasOf, properties) as AliasToken
		if (current === null) return false
		if (traversed.includes(current)) return true
	}
	return false
}
