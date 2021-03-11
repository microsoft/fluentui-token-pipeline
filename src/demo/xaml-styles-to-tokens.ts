const fs = require("fs")

/*

Example script to convert a text file of token names into JSON mappings

1. Create an Excel spreadsheet mapping WinUI lightweight styling resource names to token names (with row 1 as column headers) and save as "Text (tab delimited)"
2. Update the constants below
3. node dist/demo/xaml-styles-to-tokens

*/

const inputFilename = "src/demo/winui-mappings.txt"
const outputFilename = "src/demo/winui-mappings.json"
// 0 is column A, 1 is column B, and so on
const winuiNameColumn = 0
const tokenNameColumn = 2

// ------------------------------------------------------------

const fileContents = fs.readFileSync(inputFilename).toString()

const tokens: any = { Meta: { FluentUITokensVersion: 0 } }

// Go through every line in the file and process it individually.
let skipFirst = true
for (const line of fileContents.split("\n"))
{
	if (skipFirst)
	{
		skipFirst = false
		continue
	}

	const cells: string[] = line.split("\t")
	const winuiName = cells[winuiNameColumn]
	const tokenName = cells[tokenNameColumn]

	if (!winuiName || !tokenName)
	{
		if (winuiName || tokenName)
			console.warn("Skipping incomplete row:", winuiName, tokenName)
		continue
	}

	// Okay, we've got the WinUI name and the token name, so add the appropriate override to our big dictionary.
	let here = tokens
	for (const part of tokenName.split("-"))
	{
		if (part in here)
		{
			here = here[part]
		}
		else
		{
			const newChild = {}
			here[part] = newChild
			here = newChild
		}
	}
	here.platform = { winui: { fullName: winuiName } }
}

const outputContents = JSON.stringify(tokens, /* replacer: */ undefined, /* space: */ "\t")

if (!fs.existsSync("out"))
	fs.mkdirSync("out")
fs.writeFileSync(outputFilename, outputContents)

console.log(`Done! Saved to: ${outputFilename}`)
