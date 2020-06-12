"use strict"

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
	"Press": 3,
	"Disabled": 4,

	length: 4,
}

class Utils
{
	/// Escapes a string for use in XML output.
	escapeXml(text)
	{
		return (typeof text === "string" ? text : text.toString()).replace(charactersToEscape, (char) => escapedCharacters[char])
	}

	/// Strip off "Set" if present, and prepend the prefix if specified.
	/// Only makes a copy of the array if necessary; otherwise, it just returns the original array.
	getModifiedPathForNaming(path, prefix)
	{
		const isSet = path[0] === "Set"
		if (isSet || prefix)
		{
			if (prefix)
				return [prefix, ...(isSet ? path.slice(1) : path)]
			else
				return path.slice(1)
		}
		else
		{
			return path
		}
	}

	/// Groups a FLAT array of properties (dictionary.allProperties) into Global, Set, and Control
	/// tokens, and then sorts them alphabetically within those groups.
	/// Mutates the original array and then returns it.
	sortPropertiesForReadability(dictionary)
	{
		dictionary.sort((a, b) =>
		{
			const categoryA = a.path[0]
			const categoryB = b.path[0]

			if (categoryA === "Global" && categoryB !== "Global") return -1
			else if (categoryB === "Global" && categoryA !== "Global") return 1

			if (categoryA === "Set" && categoryB !== "Set") return -1
			else if (categoryB === "Set" && categoryA !== "Set") return 1

			if (a.path.length === b.path.length)
			{
				for (let i = 0; i < a.path.length; i++)
				{
					if (i === a.path.length - 1)
					{
						const finalA = a.path[a.path.length - 1]
						const finalB = b.path[b.path.length - 1]

						// For tokens that differ only by interaction state, sort them in a more natural order than alphabetically.
						const interactionIndexA = orderOfInteractionStates[finalA] || orderOfInteractionStates.length
						const interactionIndexB = orderOfInteractionStates[finalB] || orderOfInteractionStates.length
						if (interactionIndexA !== interactionIndexB) return interactionIndexA - interactionIndexB

						// For tokens that differ only by a numeric index, sort them numerically.
						const indexA = parseInt(finalA, 10)
						if (!isNaN(indexA))
						{
							const indexB = parseInt(finalB, 10)
							if (!isNaN(indexB)) return indexA - indexB
						}
					}
					if (a.path[i] !== b.path[i]) break
				}
			}

			if (a.name < b.name) return -1
			else if (a.name > b.name) return 1

			console.error(`Somehow found two identically-named tokens! "${a.name}"`)
			return 0
		})
		return dictionary
	}

	/// For each property in the Style Dictionary properties object or a subtree, call a specific callback function.
	forEachRecursive(subtree, callbackfn, options)
	{
		if (!subtree || !callbackfn)
			throw new Error("Usage: forEachRecursive(subtree, callbackfn, options?)")
		const requiredChild = options && options.requiredChild

		for (const key in subtree)
		{
			if (!subtree.hasOwnProperty(key)) continue
			const prop = subtree[key]
			if (typeof prop !== "object") continue

			if (!requiredChild || requiredChild in prop)
			{
				// Either we aren't looking for a specific type of child, or this is indeed a child prop of the type we're looking for.
				callbackfn(prop, key, subtree)
			}
			else if (!("value" in prop || "aliasOf" in prop || "computed" in prop))
			{
				// This is another subtree, and it isn't one of the known types, so continue recursion into it.
				this.forEachRecursive(prop, callbackfn, options)
			}
		}
	}
}
module.exports = new Utils
