const Gulp = require("gulp")
const TypeScript = require("gulp-typescript")

const typescriptProject = TypeScript.createProject("tsconfig.json")
const typescript = () => Gulp
	.src(["src/**/*.ts", "src/**/*.js"])
	.pipe(typescriptProject())
	.pipe(Gulp.dest("dist"))
typescript.displayName = "Compile TypeScript"

const watch = () =>
{
	Gulp.watch(["src/**/*.ts", "src/**/*.js"], typescript)
}
watch.displayName = "Watch for code changes"

exports.build = Gulp.series(typescript)
exports.watch = Gulp.series(typescript, watch)

exports.default = exports.build
