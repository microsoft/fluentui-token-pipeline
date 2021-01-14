import args from "args"

args
	.option("tokens", "Path to the tokens JSON") // string | undefined

const flags = args.parse(process.argv)

console.log(`This is where we'd process ${flags.tokens || "your token JSON"} if this were implemented.`)
