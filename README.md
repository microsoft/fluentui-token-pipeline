# FluentUI token pipeline

The FluentUI token pipeline produces source code for the FluentUI libraries. It's currently a functional prototype.

## Setting up

After cloning the repo, run `npm install` once to install dependencies.

## Configuring the pipeline (optional)

You can change the source tokens used for producing output in `src/tokens/fluentui.json`, or configure the pipeline to use a different location in `src/pipeline/config.js`. The pipeline will output files to the `build` folder; you can configure that in `config.js` as well.

*For more information about `config.js`, see the [style-dictionary](https://amzn.github.io/style-dictionary/) documentation: the FluentUI token pipeline uses `style-dictionary` for its configuration.*

## Building the pipeline

To build the pipeline and produce the output files, just run `npm run build`. That's it!

You can use `npm run watch` instead to automatically re-run the pipeline whenever you change the source tokens file `fluentui.json`.

Note that currently the pipeline is a self-contained process rather than a command-line tool that takes in an arbitrary JSON as input. That's a decision made for rapid development and prototyping, definitely not a stake in the ground!

## Verifying that it works

Open one of the pages in `src/demo/web/` in a browser after building to see some of the tokens used in code.

* [Sample app](src/demo/web/app-demo.html)
* [Button styles](src/demo/web/buttons-demo.html)

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# Pipeline format reference

## About design tokens

This readme assumes that you're familiar with the general concept of design tokens. If not, get in touch with us, and we can try to point you to something that will help you get started.

But let's get clear on the naming system that we have for different types of tokens:

* At the core are your global tokens, which contain all of the different values in your design system: colors, sizes, typography, and more. They have very specific names and no particular meaning. For example, "blue #60" would be a global token, such as `Global.Color.Blue.60`.
* Alias tokens give semantic meaning to those raw values. For example, if design dictates that a control that performs an action that is accent-colored should have a background fill color when hovered as blue #60, they might set `Set.AccentActionControl.Fill.Color.Hover` to be an *alias* of `Global.Color.Blue.60`.
* Alias sets are just groups of alias tokens that can be reused for convenience and consistency. For example, `Set.AccentActionControl.Fill.Color` is a set that defines `.Rest`, `.Hover`, `.Press`, and `.Disabled` colors for that same part of the same type of control. Assigning something else to be an alias of that set is just a simpler way of assigning individual Rest, Hover, Press, and Disabled properties to those individual alias tokens—it's exactly equivalent.
* Finally, controls in your UI platform of choice get their default styling values from control tokens. For example, an accent-colored button's root (background) element's fill color when hovered should be set to `AccentButton.Root.Fill.Color.Hover`.

After building once, it can sometimes be helpful to refer to [`build/reference/fluentuitokens.html`](build/reference/fluentuitokens.html)—it's effectively a more human-readable version of `fluentuitokens.json` that gets built by the pipeline.

## Token organization

**The organization and naming of the tokens in `fluentuitokens.json` is intentional, and affects how they are processed and exported.** So, it's useful to know the basics of that organization.

* Global tokens go in the `Global` node. Tokens under `Global` should all contain raw values and not refer to any other token, with few exceptions. (One reasonable exception might be that if we wanted to treat "Accent" as a color and put it next to other colors such as blue and red, but *define* the Accent colors as identical to the blue colors, for example.)
* Alias tokens and sets go in the `Set` node. (More on what that means momentarily.) Tokens under `Set` should never have a distinct value, and instead should be defined based on other tokens. Sets don't have to be explicitly defined as a set—they're just how we refer to any grouping of alias tokens. `Set.MyFavoriteColors` is just a way of saying  "all of the tokens defined under 'MyFavoriteColors'."
* Control tokens go outside of those two top-level nodes. They should be defined based on alias tokens and sets, and occasionally global tokens.

The full name of a token is just a list of all of its parents in the JSON and its lowest-level name, separated by dots. For example:

```js
	"Global": {
		"Color": {
			"Mauve": { "value": "#e0b0ff" }
		}
	}
```

The full name of that token is `Global.Color.Mauve`. (While the JSON always uses dots to separate the name, it's also often written with hyphens, such as `Global-Color-Mauve`.)

## A single token

That previous example code is how each raw token value is specified in the JSON: a property whose value is an object containing the key `value` and then the value of the property. That's the syntax used by Style Dictionary, which we've kept. It's a little verbose, but it's what allows us to do more than just having a flat list of names and values.

More information on how to format the values in the JSON is ahead in the "value types" section.

## Groups of tokens

A token name and value can be nested inside of other nodes to keep things tidy. For example, you have a top-level node called `Global`, which includes colors under `Color`, and then the color `Mauve` under that. `Mauve` itself could also just be a grouping, with tokens `10`, `20`, and `30` beneath it: `Global.Color.Mauve.10`, `Global.Color.Mauve.20`, and so on.

But, importantly, a token can't have both a value *and* tokens beneath it. For example, if you tried to define `Global.Color.Mauve` *and* `Global.Color.Mauve.10`, the latter would end up getting ignored.

## Alias tokens

A token doesn't have to have a raw value. Instead, it can be defined as an *alias* of another token. That token could also be an alias of yet another token and so on, as long as it eventually points to something that isn't an alias. You define an alias like this:

```js
{ "Global": { "Color": { "AccentBase": { "aliasOf": "Global.Color.Blue.60" } } } }
```

An alias token doesn't get a value. Instead, supply the property `aliasOf` and then the dot-separated name of the token that its value should be based on.

If possible, alias tokens will keep those links when exported. For example, the CSS output would look like this:

```css
--global-color-accentbase: var(--global-color-blue-60);
```

## Token sets

You don't have to do anything special to define a token set. To *use* a token set, just use `aliasOf` on something higher in the hierarchy than a single token. For example, let's say you had color tokens `Global.Color.Blue.1`, `Global.Color.Blue.2`, and so on all the way up to `100`. If you wanted to define `Global.Color.Accent.n` as equivalent to `Global.Color.Blue.n`, you don't have to set up 100 separate alias tokens. Instead, you just do this:

```json
{ "Global": { "Color": { "Accent": { "aliasOf": "Global.Color.Blue" } } } }
```

This is also really useful for packaging up different sets of rest, hover, pressed, and disabled colors for controls. Lots of basic controls will use the same four colors for their background in those states. So you can define a set for those:

```json
{
	"Set": {
		"ActionControl": {
			"Fill": {
				"Color": {
					"Rest": { "aliasOf": "Global.Color.Neutral.5" },
					"Hover": { "aliasOf": "Global.Color.Neutral.6" },
					"Press": { "aliasOf": "Global.Color.Neutral.4" },
					"Disabled": { "aliasOf": "Global.Color.Neutral.3" }
				}
			}
		}
	}
}
```

Then, you can apply all four of those state colors to a single control later on like this:

```json
{
	"Button": {
		"Root": {
			"Fill": {
				"Color": { "aliasOf": "Set.ActionControl.Fill.Color" }
			}
		}
	}
}
```

That's exactly the same as specifying that `Button.Root.Fill.Color.Rest` is equal to `Set.ActionControl.Fill.Color.Rest` and so on, but it's a lot easier to work with, and helps avoid mistakes.

## Computed tokens

You may also want to define a token as a *computation* based on another token and some adjustment. Currently, only opacity adjustments are supported.

```json
{ "Hover": { "computed": { "color": "Global.Color.AccentBase", "opacity": 0.05 } } }
```

Instead of specifying that `Hover` has a raw `value` or is an `aliasOf` another token, you specify that it is `computed` and then specify the inputs to that computation. In this case, the name of an existing `color` token, and a new `opacity` to apply to that color.

Unlike regular alias tokens, these computations can't be preserved in the output format. For example, in CSS, that token would be specified as a single `rgba()` value instead of something involving `calc()` or JavaScript.

## Value types

Values in `fluentuitokens.json` are stored in a format very similar to CSS web standards, and then converted to the proper format and syntax for each platform that the pipeline exports to.

The pipeline infers the data type from the token's full name, *not* its value. So, **it's important to follow the naming scheme of existing tokens in the pipeline**. You can see the code that handles this in [`fluentui-shared.js`](src/pipeline/fluentui-shared.js).

Tokens can represent any of the following value types:

### Colors

A color, with or without an alpha channel, in CSS syntax.

* `"#rrggbb"` or `"#rrggbbaa"`
* `"rgb(255, 255, 255)"` or `"rgba(255, 255, 255, 0.5)"`
* `"transparent"`, `"white"`, or `"black"`

### Widths, padding, and radii

Stroke widths and radii can be specified as a single value or as an array in the same order that CSS specifies. They're specified as device-independent pixels **without units**.

* `16`
* `[top, right, bottom, left]`
	* `[top-left, top-right, bottom-right, bottom-left]` for corner radii
* <strike>**not** `"16px"`</strike>

### Font families

Font families are specified as in CSS, with fallbacks. You can include a generic font family such as `monospace` or `serif` at the end, and the pipeline will remove it for non-web platforms.

* `"Segoe UI"`
* `"\"Segoe UI\", \"Helvetica Neue\", 'Comic Sans MS', Arial, sans-serif"`

### Font sizes

Font sizes are specifed in device-independent pixels (not points) **without units**.

* `15`
* <strike>**not** `"15px"`</strike>

### Font weights

Font weights are specified in standard weight units, integers 100-900.

* `600`
* <strike>**not** `"semibold"`</strike>

### Widths and heights

Element widths and heights are specifed as independent properties in device-independent pixels (not points) **without units**.

* `80`
* <strike>**not** `"80px"`</strike>
* <strike>**not** `"1024 768"`</strike>
