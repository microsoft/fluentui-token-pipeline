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
	/// Returns a Style Dictionary attributes object or null.
	getSDAttributes(category, attribute)
	{
		if (category === 'Stroke')
		{
			if (attribute === 'Width') return { category: 'size', xamlType: 'Thickness' }
		}
		if (category === 'Corner')
		{
			if (attribute === 'Radius') return { category: 'size', xamlType: 'CornerRadius' }
		}
		if (attribute === 'Color') return { category: 'color', xamlType: 'SolidColorBrush' }
		if (attribute === 'Padding') return { category: 'size', xamlType: 'Thickness' }
		if (category === 'Font')
		{
			if (attribute === 'Family') return { category: 'font', xamlType: 'FontFamily' }
			if (attribute === 'Size' || attribute === 'LineHeight') return { category: 'size', xamlType: 'x:Double' }
			if (attribute === 'Weight') return { category: 'fontWeight', xamlType: 'x:Double' }
		}
		return null
	}

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
