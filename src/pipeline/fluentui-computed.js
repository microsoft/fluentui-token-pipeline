"use strict"

const Color = require("tinycolor2")
const FluentUIAliases = require("./fluentui-aliases")

class FluentUIComputed
{
	/// Resolves all of the computed tokens in an entire Style Dictionary properties object, and then returns the same object
	/// instance, modified.
	resolveComputedTokens(properties)
	{
		// TODO: Recurse (for now, just look up the specific property we care about)
		const accentTintProp = FluentUIAliases.findPropByPath("Global.Color.AccentTint", properties)
		if (accentTintProp)
			FluentUIComputed._resolveComputed(accentTintProp, properties)

		// Then, we just return the same object that was passed in, but modified.
		return properties
	}

	/// Resolve a single computed property, replacing the computation with a value.
	static _resolveComputed(prop, properties)
	{
		// First, verify that this is indeed a computed token.
		if (typeof prop !== "object" || !("computed" in prop))
			throw new Error("Method was called on a property that wasn't a computed token.")
		if (typeof prop.computed !== "object")
		{
			console.error(`ERROR: Invalid computed: ${JSON.stringify(prop.computed)}. The computed property should be an object describing a valid token computation.`)
			prop.value = "<ERROR: Invalid computed syntax>"
			return null
		}

		// You can't use computed and value at the same time.
		if ("value" in prop)
		{
			console.error(`ERROR: computed: ${JSON.stringify(prop.computed)} was used along with value ${JSON.stringify(prop.value)}, so the computation was ignored.`)
		}

		// Now, verify that it's a supported type of computation, and if so, resolve it.
		if (FluentUIComputed._isColorComputation(prop))
		{
			FluentUIComputed._resolveColorComputation(prop, properties)
			return
		}

		// If we got this far, it wasn't a supported computation.
		console.error(`ERROR: Invalid computed: ${JSON.stringify(prop.computed)}. Unable to determine what type of computation to perform.`)
		prop.value = "<ERROR: Unknown computation type>"
		return null
	}

	static _isColorComputation(prop)
	{
		return "color" in prop.computed && "opacity" in prop.computed
	}

	static _resolveColorComputation(prop, properties)
	{
		// First, validate the inputs.
		const originalColorToken = FluentUIAliases.findPropByPath(prop.computed.color, properties)
		if (!originalColorToken)
		{
			console.error(`ERROR: Couldn't find the token "${prop.computed.color}" used in a computed property.`)
			prop.value = "<ERROR: Missing input token>"
			return null
		}

		const originalColorString = originalColorToken.value
		if (!originalColorString)
		{
			console.error(`ERROR: The token "${prop.computed.color}" used in a computed property didn't have a value.`)
			prop.value = "<ERROR: Missing input token value>"
			return null
		}
		const originalColor = new Color(originalColorString)

		const newOpacity = parseFloat(prop.computed.opacity)
		if (isNaN(newOpacity))
		{
			console.error(`ERROR: Invalid opacity value ${JSON.stringify(newOpacity)} used in a computed property.`)
			prop.value = "<ERROR: invalid opacity>"
			return null
		}

		// Hooray, looks like it's all valid. Compute a value for this token.
		const newColor = originalColor.clone()
		newColor.setAlpha(newOpacity)
		prop.value = newColor.toRgbString()
		return prop
	}
}

module.exports = new FluentUIComputed()
