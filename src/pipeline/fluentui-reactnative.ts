import StyleDictionary from "style-dictionary"

StyleDictionary.registerTransform({
	name: "fluentui/font-weight/string",
	type: "value",
	matcher: prop => prop.attributes.category === "fontWeight",
	transformer: prop => prop.value.toString(),
})

StyleDictionary.registerTransformGroup({
	name: "fluentui/reactnative",
	transforms: ["fluentui/attribute", "fluentui/name/json/grouped", "fluentui/alias/flatten", "fluentui/color/css", "fluentui/font-weight/string", "fluentui/shadow/json"],
})
