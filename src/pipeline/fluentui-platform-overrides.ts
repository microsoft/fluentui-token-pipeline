import * as Utils from "./utils"

class FluentUIPlatformOverrides
{
	/// Applies all of the overrides in an entire Style Dictionary properties object, and then returns the same object
	/// instance, modified.
	resolvePlatformOverrides(properties: any): any
	{
		const resolver = (prop: any, key: string) =>
		{
			// NYI
		}
		Utils.forEachRecursive(properties, resolver, { requiredChild: "platform" })

		// Then, we just return the same object that was passed in, but modified.
		return properties
	}
}

export default new FluentUIPlatformOverrides()
