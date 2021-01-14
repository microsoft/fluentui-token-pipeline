import args from "args"
import { buildEverything } from "../pipeline"

args
	.option("in", "One more more token JSON files to use as input", ["src/tokens/fluentui.json"])
	.option("out", "A path to output built files to", "build")

const flags = args.parse(process.argv)

buildEverything(flags.in, flags.out)
