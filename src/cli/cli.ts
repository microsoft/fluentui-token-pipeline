import args from "args"
import { buildEverything } from "../pipeline"

(() =>
{
	args
		.option("in", "One more more token JSON files to use as input", [])
		.option("out", "A path to output built files to", "build")
		.example("transform-tokens --in mytokens.json --out build", "Transform mytokens.json and put the output in a folder called \"build\".")

	const flags = args.parse(process.argv, { name: "transform-tokens" })

	if (!flags.in || flags.in.length === 0)
	{
		console.error("Specify at least one input tokens file with --in.\n")
		args.showHelp()
		return
	}

	buildEverything(flags.in, flags.out)
})()