import args from "args"
import { buildOutputs } from "../pipeline"

(() =>
{
	// Parse and validate the command-line arguments using the 'args' package.
	args
		.option("in", "A JSON file to use as input", [])
		.option("out", "A path to output built files to", "build")
		.option("platform", "A platform to build outputs for (debug, json, reference, w3c, css, react, reactnative, ios, winui, figmatokens, dcs)", [])
		.example("transform-tokens --in mytokens.json --out build", "Transform mytokens.json and put the output in a folder called \"build\".")
		.example("transform-tokens --in mytokens.json --out build -p winui -p css", "Just output the files for the winui and css platforms.")

	const flags = args.parse(process.argv, { name: "transform-tokens" })

	if (!flags.in || flags.in.length === 0)
	{
		console.error("Specify at least one input tokens file with --in.\n")
		args.showHelp()
		return
	}

	if (flags.platform[0] === true)
	{
		console.error("Specify a platform name to build outputs for, or leave off the --platform argument.\n")
		args.showHelp()
		return
	}
	else if (flags.platform.length === 0)
	{
		delete flags.platform
	}

	// Now, build what they asked for.
	buildOutputs(flags.in, flags.out, flags.platform)
})()
