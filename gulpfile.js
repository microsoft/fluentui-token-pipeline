const { execSync } = require("child_process")
const Gulp = require("gulp")

const build = (callback) =>
{
	const StyleDictionary = require("style-dictionary").extend("./src/pipeline/config.js")
	StyleDictionary.buildAllPlatforms()

	callback()
}

const buildCli = (callback) =>
{
	execSync("npx style-dictionary build --config ./src/pipeline/config.js", { windowsHide: true }, (error, stdout, stderr) =>
	{
		if (error)
		{
			console.error(error)
			return
		}
		console.log(stdout)
		console.error(stderr)
	})

	callback()
}

const watch = (callback) =>
{
	Gulp.watch(["src/tokens/**", "./src/pipeline/*.js"], buildCli)

	callback()
}

exports.build = build
exports.watch = Gulp.series(build, watch)

exports.default = build
