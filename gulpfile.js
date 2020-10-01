const { exec } = require("child_process")
const Gulp = require("gulp")
const TypeScript = require("gulp-typescript")

const typescriptProject = TypeScript.createProject("tsconfig.json")
const typescript = () => Gulp
	.src("src/pipeline/**/*.ts")
	.pipe(typescriptProject())
	.pipe(Gulp.dest("build/pipeline"))
typescript.displayName = "Compile TypeScript"

const build = (callback) =>
{
	const StyleDictionary = require("style-dictionary").extend("./build/pipeline/config.js")
	StyleDictionary.buildAllPlatforms()

	callback()
}
build.displayName = "Build all platforms"

const buildCli = () =>
	exec("npx style-dictionary build --config ./build/pipeline/config.js", { windowsHide: true }, (error, stdout, stderr) =>
	{
		if (error)
		{
			console.error(error)
			return
		}
		console.log(stdout)
		console.error(stderr)
	})
buildCli.displayName = "Build all platforms (changes were noticed)"

const watch = () =>
{
	Gulp.watch(["src/tokens/**", "src/pipeline/*.ts"], Gulp.series(typescript, buildCli))
}
watch.displayName = "Watch for changes"

exports.ts = Gulp.series(typescript)
exports.build = Gulp.series(typescript, build)
exports.watch = Gulp.series(typescript, build, watch)

exports.default = exports.build
