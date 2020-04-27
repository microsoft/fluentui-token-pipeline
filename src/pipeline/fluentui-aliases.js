"use strict"

class FluentUIAliases
{
	/// Resolves all of the aliases in an entire Style Dictionary properties object, and then returns the same object
	/// instance, modified.
	resolveAliases(properties)
	{
		// Okay, buckle in, cupcake: we're gonna traverse this whole properties tree and find every alias token in the bunch.
		// (Note that we're only looking for FluentUI aliases, not Style Dictionary aliases.)
		const resolveSubtree = (subtree) =>
		{
			for (const key in subtree)
			{
				if (!subtree.hasOwnProperty(key)) continue
				const prop = subtree[key]
				if (typeof prop === "object")
				{
					if ("aliasOf" in prop)
					{
						// This is an alias. Resolve it, and then recurse into it, because the alias target itself may contain aliases.
						if (this._resolveAlias(prop, properties))
						{
							if ("aliasOf" in prop)
								console.error(`_resolveAlias failed to resolve ${key} -- skipping to prevent infinite recursion.`)
							else
								resolveSubtree(prop)
						}
					} else if (!("value" in prop))
					{
						// This is another subtree, so continue recursion into it. 
						resolveSubtree(prop)
					}
				}
			}
		}
		resolveSubtree(properties)

		// Then, we just return the same object that was passed in, but modified.
		return properties
	}

	/// Resolves an alias, replacing the reference with something useful.
	_resolveAlias(prop, properties)
	{
		// First, verify that this alias is valid. We only support aliasing with a single string right now.
		// (In the future, we could use aliasOf: { target: "Token.Name", options... }, or aliasOf: [...].)
		if (typeof prop !== "object" || !("aliasOf" in prop))
			throw new Error("Method was called on a property that wasn't an alias of anything.")
		if (typeof prop.aliasOf !== "string")
		{
			console.error(`ERROR: Invalid aliasOf: ${JSON.stringify(prop.aliasOf)}. The aliasOf property should be a dot-delimited path to another token to refer to, such as "Global.Color.Blue".`)
			prop.value = "<ERROR: Invalid aliasOf syntax>"
			return null
		}

		// You can't use aliasOf and value at the same time.
		if ("value" in prop)
		{
			console.error(`ERROR: aliasOf: ${JSON.stringify(prop.aliasOf)} was used along with value ${JSON.stringify(prop.value)}, so the alias was ignored.`)
		}

		// Let's find what the alias is targeting. It could be a single token, or a whole set.
		const target = this._findPropByPath(prop.aliasOf, properties)
		if (target === null)
		{
			console.error(`ERROR: Invalid aliasOf: ${JSON.stringify(prop.aliasOf)}. That token doesn't exist.`)
			prop.value = `<ERROR: token ${JSON.stringify(prop.aliasOf)} missing>`
			return null
		}

		if (this._hasCircularReferences(prop, target, properties))
		{
			console.error(`ERROR: Invalid aliasOf: ${JSON.stringify(prop.aliasOf)} is in a chain of circular references.`)
			prop.value = `<ERROR: circular reference involving ${JSON.stringify(prop.aliasOf)}>`
			return null
		}

		// Okay, it's a good alias! Merge this property with a deep clone of the alias target.
		this._mergeProps(prop, target, prop.aliasOf, properties, this._mergePropsOptions)

		// Return the resolved property to indicate that we successfully resolved the alias.
		return target

		// TODO: Allow users to perform math, such as "tokenZ = tokenX * tokenY - 1", or color manipulation.
	}

	/// Deep-clones a target property's contents onto an alias property. Values already existing on the alias property are not overwritten.
	/// After this method, the property will no longer be an alias.
	_mergeProps(prop, target, targetPath, properties, options)
	{
		console.assert(
			typeof target === "object",
			"This function assumes that the target is always an object, often of the form { value: 123 }.")

		// This property will be resolved when this method finishes, so remove the alias reference.
		// (We save the path in resolvedAliasPath so that we can use it for output formatting.)
		delete prop.aliasOf

		// First of all, figure out what the target is.
		// prop = { aliasOf: "target" }
		if (typeof target === "object")
		{
			if ("value" in target)
			{
				// The alias target is a simple value. Easy!
				// target = { value: 123 }
				prop.value = target.value
				prop.resolvedAliasPath = targetPath
			}
			else if ("aliasOf" in target)
			{
				// The alias target is another alias, so it's recursion time.
				// target = { aliasOf: "targetoftarget" }
				this._resolveAlias(target, properties)
			}
			else
			{
				// The alias target is a set, so we need to iterate through keys.
				// target = { A: { value: 1 }, B: { value: 2 }, C: { aliasOf: "targetoftarget" }, D: { D1: ..., D2: ... } }
				for (const key in target)
				{
					if (!target.hasOwnProperty(key)) continue
					if (key in prop)
					{
						// TODO: Remove this warning once we're 100% confident that things are working, since it's a normal case that doesn't indicate any sort of failure.
						console.log(`When merging in a set, I skipped "${key}" from the alias target because it was overridden. (This is probably expected, unless you see a lot of these.)`)
						continue
					}

					const targetProp = target[key]
					// targetProp = { value: 1 } or { aliasOf: "targetoftarget" } or { D1: ..., H2: ... }
					if (typeof targetProp === "object")
					{
						// target.key is another value or alias, so recurse.
						prop[key] = {}
						this._mergeProps(prop[key], targetProp, `${targetPath}.${key}`, properties, options)
					}
				}
			}
		}
		else
		{
			// The target isn't a value, alias, or set, so it must be metadata or something else that we don't need to copy.
			console.log(`Skipping from target: ${targetPath}, because we're not sure what ${JSON.stringify(subpropOnTarget)} is`)
		}
	}

	/// Given a path string ("Global.Color.Blue") and a properties dictionary, returns the property at that path.
	/// Returns null if the target can't be found.
	_findPropByPath(path, properties)
	{
		const targetPathParts = path.trim().split(".")
		if (targetPathParts.length === 0) return null

		let target = properties
		for (let i = 0; i < targetPathParts.length; i++)
		{
			const thisPart = targetPathParts[i]
			if (!(thisPart in target)) return null
			target = target[targetPathParts[i]]
		}
		return target
	}

	/// Returns true if there are circular references in a chain of aliases.
	_hasCircularReferences(original, target, properties)
	{
		// Do a couple of quick checks before doing any expensive work.
		if (original === target) return true
		if (typeof target !== "object") return false
		if (!("aliasOf" in target)) return false

		const traversed = [original]
		let current = target
		while (current)
		{
			if (!("aliasOf" in current)) return false
			traversed.push(current)

			current = this._findPropByPath(current.aliasOf, properties)
			if (current === null) return false
			if (traversed.includes(current)) return true
		}
		return false
	}
}

module.exports = new FluentUIAliases()
