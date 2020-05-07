"use strict"

const Color = require("tinycolor2")

class FluentUIColorRamps
{
	/**
		Replaces a Global.Color token of this form:
			"Orange": { "buildRampFrom": "#ff8c00" }
		...with a ramp of colors using that original color as index 100.
			"Orange" : { "100": { value: "#ff8c00" }, "20": { ... }, "120": { ... } }

		The formula used for this ramp is arbitrary and this is a proof-of-concept.
		Currently not intended for use outside of demos.
	*/
	buildColorRamps(properties)
	{
		const colors = properties.Global.Color
		for (const key in colors)
		{
			const color = colors[key]
			if (typeof color === "object" && "buildRampFrom" in color)
				FluentUIColorRamps._replaceWithColorRamp(color)
		}

		return properties
	}

	static _replaceWithColorRamp(color)
	{
		const colorInfo = new Color(color.buildRampFrom)
		delete color.buildRampFrom
		delete color.aliasOf

		color["20"] = { value: colorInfo.clone().lighten(40).toHexString() }
		color["40"] = { value: colorInfo.clone().lighten(30).toHexString() }
		color["60"] = { value: colorInfo.clone().lighten(20).toHexString() }
		color["80"] = { value: colorInfo.clone().lighten(10).toHexString() }
		color["100"] = { value: colorInfo.toHexString() }
		color["120"] = { value: colorInfo.clone().darken(10).toHexString() }
		color["140"] = { value: colorInfo.clone().darken(20).toHexString() }

		return color
	}
}

module.exports = new FluentUIColorRamps()
