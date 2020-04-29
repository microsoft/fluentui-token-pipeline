"use strict"

const charactersToEscape = /([<>&])/g
const escapedCharacters =
{
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
}

class Utils
{
	/// Escapes a string for use in XML output.
	static escapeXml(text)
	{
		return (typeof text === "string" ? text : text.toString()).replace(charactersToEscape, (char) => escapedCharacters[char])
	}

	/// Strip off "Set" if present, and prepend the prefix if specified.
	/// Only makes a copy of the array if necessary; otherwise, it just returns the original array.
	static getModifiedPathForNaming(path, prefix)
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
	static sortPropertiesForReadability(dictionary)
	{
		dictionary.sort((a, b) =>
		{
			const categoryA = a.path[0]
			const categoryB = b.path[0]

			if (categoryA === "Global" && categoryB !== "Global") return -1
			else if (categoryB === "Global" && categoryA !== "Global") return 1

			if (categoryA === "Set" && categoryB !== "Set") return -1
			else if (categoryB === "Set" && categoryA !== "Set") return 1

			if (a.name < b.name) return -1
			else if (a.name > b.name) return 1

			console.error(`Somehow found two identically-named tokens! "${a.name}"`)
			return 0
		})
		return dictionary
	}
}
module.exports = new Utils
