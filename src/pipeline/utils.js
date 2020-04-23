"use strict"

const _ = require("lodash")

const charactersToEscape = /([\<\>\&])/g
const escapedCharacters =
{
	'<': '&lt;',
	'>': '&gt;',
	'&': '&amp;',
}

class Utils
{
	escapeXml(text)
	{
		return (typeof text === 'string' ? text : text.toString()).replace(charactersToEscape, (char) => escapedCharacters[char])
	}

	getModifiedPathForNaming(path, prefix)
	{
		// Strip off "Set" if present, and prepend the prefix if specified.
		// Only makes a copy of the array if necessary; otherwise, it just returns the original array.
		const isSet = path[0] === 'Set'
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

}
module.exports = new Utils
