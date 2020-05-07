"use strict"

const StyleDictionary = require("style-dictionary")
const _ = require("lodash")

const Utils = require("./utils")

const getNameForSwift = (path, prefix) => _.camelCase(Utils.getModifiedPathForNaming(path, prefix).join(" "))

const getCGFloatFromNumber = (value) => parseFloat(value, 10).toFixed(1)

StyleDictionary.registerTransform({
	name: "fluentui/name/swift",
	type: "name",
	transformer: (prop, options) => getNameForSwift(prop.path, options.prefix),
})

StyleDictionary.registerTransform({
	name: "fluentui/alias/swift",
	type: "value",
	matcher: (prop) => "resolvedAliasPath" in prop,
	transformer: (prop, options) => `${getNameForSwift(prop.resolvedAliasPath.split("."), options.prefix)}`,
})

StyleDictionary.registerTransform({
	name: "fluentui/size/swift",
	type: "value",
	matcher: (prop) => prop.attributes.category === "size",
	transformer: (prop, options) =>
	{
		/*
			Transforms an array of top/right/bottom/left values into UIEdgeInsets(top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat).
			Single values are also allowed. All numbers are interpreted as pixels.

			100
				-->
			100.0

			[ 100, 200, 300, 400 ]
				-->
			UIEdgeInsets(top: 100.0, left: 400.0, bottom: 300.0, right: 200.0)
		*/
		const value = prop.value
		if (typeof value === "number")
			return `${getCGFloatFromNumber(value)}`
		else if (Array.isArray(value) && value.length === 4)
			return `UIEdgeInsets(top: ${getCGFloatFromNumber(value[0])}, left: ${getCGFloatFromNumber(value[3])}, bottom: ${getCGFloatFromNumber(value[2])}, right: ${getCGFloatFromNumber(value[1])})`
		else
			console.warn(`Unrecognized size value: "${value}". Use a single number or an array [top, right, bottom, left].`)
	},
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/swift",
	transforms: ["fluentui/attribute", "fluentui/name/swift", "fluentui/alias/swift", "time/seconds", "fluentui/size/swift", "font/swift/literal", "color/UIColorSwift"],
})
