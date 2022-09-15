---
title: Using the pipeline CLI
---

🏠 [Home](./)

# Using the pipeline CLI

You can use the pipeline as a command-line tool.

## Setting up

Install [Node.js](https://nodejs.org/), and then do *one* of the following:

* Clone this repo and build it, and then run `npm link` to install the tool globally
* From *another* repo, add a dev dependency on `@fluentui/token-pipeline`

Once you have the tool set up, run:

```console
transform-tokens
```

You'll get details of the arguments and their usage. Here's a full usage example:

```console
transform-tokens --in tokens.json --out build
```

That will transform the tokens in one single JSON file and output them to a subfolder named `build`.

### Using NPX

Alternatively, if you prefer, you can use `npx` to use the pipeline without any repos at all. Replace `transform-tokens` in the command with `npx @fluentui/token-pipeline`:

```console
npx @fluentui/token-pipeline --in tokens.json --out build
```

### Using the CLI as a build step in another repo

You can use this CLI as a build step in another repo with this in your `package.json`:

```json
"devDependencies": {
	"@fluentui/token-pipeline": "0.12.1"
},
"scripts": {
	"build": "transform-tokens --in tokens.json --out build"
}
```

Then, when you run `npm run build` in that repo, it would produce output into a `build` subfolder based on tokens defined in `tokens.json`.

## Output structure

All outputs will be generated into the folder specified by `--out`.

* If exactly one platform is specified, the files are generated directly into that folder.
* If more than one platform is specified (or none are, indicating that all platforms should be exported), the files are generated into subfolders of that folder.

For example:

* `transform-tokens --platform css --in tokens.json --out build` would generate `./build/tokens.css`.
* `transform-tokens --in tokens.json --out build` (without `--platform`) would generate `./build/web/tokens.css`.

The file and subfolder names are defined by the individual transforms and cannot be further configured on the command line.

## Security

This project generates code. The JSON files that it accepts as input are assumed trustworthy. Given a malicious input, it would be possible to generate malicious code through injection, so treat changes to your token JSON with the same scrutiny that you would give to code changes.
