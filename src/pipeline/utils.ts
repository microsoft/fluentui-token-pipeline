import { Token, TokenSet, ValueToken } from "./types"
import _ from "lodash"

const charactersToEscape = /([<>&])/g
const escapedCharacters =
{
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
}

const orderOfInteractionStates =
{
	"Rest": 1,
	"Hover": 2,
	"Pressed": 3,
	"Disabled": 4,

	length: 4,
}

/// Escapes a string for use in XML output.
export const escapeXml = (text: any): string =>
{
	return (typeof text === "string" ? text : text.toString()).replace(charactersToEscape, char => escapedCharacters[char])
}

/// PascalCase is camelCase with a capital letter.
export const pascalCase = (text: string | string[]): string =>
{
	return (typeof text === "string") ?
		_.upperFirst(_.camelCase(text)) :
		_.upperFirst(_.camelCase(text.join(" ")))
}

/// Given a prop, returns the components of its name as an array of strings.
/// If the prop hasn't been processed by Style Dictionary yet, you need to manually specify its path as a string.
export const getTokenExportPath = (prop: Token, propPath?: string): string[] =>
{
	if (typeof prop !== "object")
		throw new Error(`Unknown input for getTokenExportPath: ${JSON.stringify(prop)}`)

	// Now we have the right token and its path. Check to see if it has a name override.
	// If it does, ignore the normal path and use that.
	const nameOverride: string | undefined = (prop as any).fullName
	let path: string[] = nameOverride ? [nameOverride] : (prop as any).path
	if (!path && propPath) path = propPath.split(".")
	if (!path)
		throw new Error(`Path wasn't present in token OR specified for getTokenExportPath: ${JSON.stringify(prop)}`)

	return path
}

/// Groups a FLAT array of properties (dictionary.allProperties) into Global, Set, and Control
/// tokens, and then sorts them alphabetically within those groups.
/// Mutates the original array and then returns it.
export const sortPropertiesForReadability = (dictionary: any[]): any[] =>
{
	dictionary.sort((a, b) =>
	{
		const categoryA = a.path[0]
		const categoryB = b.path[0]

		// Global tokens before everything else.
		if (categoryA === "Global" && categoryB !== "Global") return -1
		else if (categoryB === "Global" && categoryA !== "Global") return 1

		// Check each path segment except the last one in order.
		const minLength = Math.min(a.path.length, b.path.length)
		for (let i = 0; i < minLength; i++)
		{
			// For the last path segment only, use special sorting rules if the paths are the
			// same length and all previous segments were equal.
			if (i === minLength - 1 && a.path.length === b.path.length)
			{
				const finalA = a.path[i]
				const finalB = b.path[i]

				// For tokens that differ only by interaction state, sort them in a more natural order than alphabetically.
				const interactionIndexA = orderOfInteractionStates[finalA] || orderOfInteractionStates.length + 1
				const interactionIndexB = orderOfInteractionStates[finalB] || orderOfInteractionStates.length + 1
				if (interactionIndexA !== interactionIndexB) return interactionIndexA - interactionIndexB

				// For tokens that differ only by a numeric index, sort them numerically.
				const indexA = parseInt(finalA, 10)
				if (!isNaN(indexA))
				{
					const indexB = parseInt(finalB, 10)
					if (!isNaN(indexB)) return indexA - indexB
				}
			}

			// Otherwise sort alphabetically.
			if (a.path[i] < b.path[i]) return -1
			else if (a.path[i] > b.path[i]) return 1
		}

		// Sort shorter tokens first.
		if (a.path.length < b.path.length) return -1
		else if (a.path.length > b.path.length) return 1

		reportError(`Somehow found two identically-named tokens! "${a.name}"`)
		return 0
	})

	return dictionary
}

/// For each property in the Style Dictionary properties object or a subtree, call a specific callback function.
export const forEachRecursive = (subtree: TokenSet, callbackfn: (prop: TokenSet | Token, path: ReadonlyArray<string>) => void, options?: { requiredChild?: string }, path: string[] = []): void =>
{
	if (!subtree || !callbackfn)
		throw new Error("Usage: forEachRecursive(subtree, callbackfn, options?)")
	const requiredChild = options && options.requiredChild

	for (const key in subtree)
	{
		if (!subtree.hasOwnProperty(key)) continue
		const prop: TokenSet | Token = subtree[key]
		if (!prop || typeof prop !== "object") continue

		const newPath = [...path, key]

		if (!requiredChild || requiredChild in prop)
		{
			// Either we aren't looking for a specific type of child, or this is indeed a child prop of the type we're looking for.
			callbackfn(prop, newPath)
		}

		// This is another subtree, so continue recursion into it. (We just know it's an object that doesn't contain the property
		// we're looking for, so It could just be a simple value token, or it would be a value or alias AND other child nodes.)
		forEachRecursive(prop as TokenSet, callbackfn, options, newPath)
	}
}

export const reportError = (description: string): void => console.error(`ERROR: ${description}`)

export const setErrorValue = (token: TokenSet | Token, error: string, description: string): void =>
{
	reportError(description);
	(token as unknown as ValueToken).value = `<ERROR: ${error}>`
}

/// Given a path string ("Global.Color.Blue") (or equivalent array) and a properties dictionary,
/// returns the property at that path. Returns null if the target can't be found.
export const findPropByPath = (path: string | string[], properties: TokenSet): Token | TokenSet | null =>
{
	const targetPathParts = typeof path === "string" ? path.trim().split(".") : path
	if (targetPathParts.length === 0) return null

	let target = properties
	for (let i = 0; i < targetPathParts.length; i++)
	{
		const thisPart = targetPathParts[i]
		if (!(thisPart in target))
		{
			console.log(`Didn't find node "${thisPart}".`)
			return null
		}
		target = target[targetPathParts[i]] as TokenSet
	}
	return target
}

/// Given a token set, finds all tokens with the path X.Y.integer and rearranges the tree so that those tokens
/// and any non-integer siblings are promoted to become tokens in the form X.Yinteger.
export const mergeNumbers = (subtree: TokenSet, setName?: string): TokenSet =>
{
	if ("value" in subtree) throw new Error("subtree must be a token set.")
	const searching = setName ? subtree[setName] : subtree
	const canMerge = searching !== subtree
	if (searching === undefined) throw new Error(`subtree does not contain a token set named "${setName}".`)

	// Example:
	// subtree = Global.Stroke
	// setName = "Width"
	// searching = Global.Stroke.Width

	// Check all of the children of the node we're searching. Do any of them have purely-integer names?
	let shouldMerge = false
	for (const key in searching)
	{
		if (!searching.hasOwnProperty(key)) continue
		const prop: TokenSet | Token = searching[key]
		if (typeof prop !== "object") continue

		// Special case for when legacy brand colors and modern brand colors are both present:
		// if there's a child named "Primary", skip this one entirely.
		if (key === "Primary")
		{
			shouldMerge = false
			break
		}

		// Okay, we'll merge this and all other children.
		shouldMerge = shouldMerge || canMerge && /^[0-9]+$/.test(key)

		// Recurse into this if it's a token set.
		if (!("value" in prop || "aliasOf" in prop || "computed" in prop))
			mergeNumbers(searching, key)
	}

	// Okay, now that recursion is done, do the merge if we decided to.
	if (shouldMerge && setName)
	{
		// Move all of the properties in searching into subtree, prepending setName to the name.
		delete subtree[setName]
		for (const key in searching)
		{
			if (!searching.hasOwnProperty(key)) continue
			const newName = `${setName}${key}`

			if (newName in subtree)
			{
				throw new Error(`I was trying to merge ${key} into its parent ${setName} as ${newName}, but a token or set with that name already exists! Continuing would result in data loss.`)
			}

			subtree[newName] = searching[key]
		}
	}

	return subtree
}
