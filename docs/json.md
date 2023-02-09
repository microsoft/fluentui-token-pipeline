---
title: Token JSON format reference
---

🏠 [Home](./)

# Token JSON format reference

This reference assumes that you're familiar with the general concept of design tokens.

This reference also only describes the original proprietary design token format. The tool now also supports some input files in the [W3C Design Token Community Group format](https://design-tokens.github.io/community-group/format), but that format is not described here.

After transforming once, it can sometimes be helpful to refer to [`build/reference/index.html`](../build/reference/index.html)—it's effectively a more human-readable version of your token JSON that gets built by the pipeline.

## Token organization

The included file `src/demo/fluentui.json` is an example of most of the different types of supported design tokens and how they are organized. **The organization and naming of the tokens in `fluentui.json` is intentional, and affects how they are processed and exported.** So, it's useful to know [the basics of that organization and naming](naming.md).

* Global tokens go in the `Global` node. Tokens under `Global` should all contain raw values and not refer to any other token, with few exceptions. (One reasonable exception might be that if we wanted to treat "Accent" as a color and put it next to other colors such as blue and red, but *define* the Accent colors as identical to the blue colors, for example.)
* Alias tokens and sets go in the `Set` node. (More on what that means momentarily.) Tokens under `Set` should never have a distinct value, and instead should be defined based on other tokens. Sets don't have to be explicitly defined as a set—they're just how we refer to any grouping of alias tokens. `Set.MyFavoriteColors` is just a way of saying "all of the tokens defined under 'MyFavoriteColors'."
* Control mappings go outside of those two top-level nodes. They should be defined based on alias tokens and sets, and occasionally global tokens.

The full name of a token is just a list of all of its parents in the JSON and its lowest-level name, separated by dots. For example:

```json
{
	"Global": {
		"Color": {
			"Mauve": { "value": "#e0b0ff" }
		}
	}
}
```

The full name of that token is `Global.Color.Mauve`. (While the JSON always uses dots to separate the name, it's also often written with hyphens, such as `Global-Color-Mauve`.)

## A single token

That previous example code is how each raw token value is specified in the JSON: a property whose value is an object containing the key `value` and then the value of the property. That's the syntax used by [style-dictionary](https://amzn.github.io/style-dictionary/), which we've kept. It's a little verbose, but it's what allows us to do more than just having a flat list of names and values.

More information on how to format the values in the JSON is ahead in the "value types" section.

## Groups of tokens

A token name and value can be nested inside of other nodes to keep things tidy. For example, you have a top-level node called `Global`, which includes colors under `Color`, and then the color `Mauve` under that. `Mauve` itself could also just be a grouping, with tokens `10`, `20`, and `30` beneath it: `Global.Color.Mauve.10`, `Global.Color.Mauve.20`, and so on.

But, importantly, a token can't have both a value *and* tokens beneath it. For example, if you tried to define `Global.Color.Mauve` *and* `Global.Color.Mauve.10`, the latter would end up getting ignored.

## Alias tokens

A token doesn't have to have a raw value. Instead, it can be defined as an *alias* of another token. That token could also be an alias of yet another token and so on, as long as it eventually points to something that isn't an alias. You define an alias like this:

```json
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
					"Rest": { "aliasOf": "Global.Color.Grey.5" },
					"Hover": { "aliasOf": "Global.Color.Grey.6" },
					"Pressed": { "aliasOf": "Global.Color.Grey.4" },
					"Disabled": { "aliasOf": "Global.Color.Grey.3" }
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
		"Base": {
			"Fill": {
				"Color": { "aliasOf": "Set.ActionControl.Fill.Color" }
			}
		}
	}
}
```

That's exactly the same as specifying that `Button.Base.Fill.Color.Rest` is equal to `Set.ActionControl.Fill.Color.Rest` and so on, but it's a lot easier to work with, and helps avoid mistakes.

Conceptually, you can think of tokens as files and sets as folders. When you look at a directory listing, the last portion of each file path is the filename—or token name. The parts before that are just an organizational scheme and don't mean much on their own. When you use `aliasOf` a single token, that's just like making a shortcut to a single file. You can also use `aliasOf` a group of tokens the same way you would make a shortcut to a whole folder.

## Computed tokens

You may also want to define a token as a *computation* based on another token and some adjustment. Currently, only opacity adjustments are supported.

```json
{ "Hover": { "computed": { "color": "Global.Color.AccentBase", "opacity": 0.05 } } }
```

Instead of specifying that `Hover` has a raw `value` or is an `aliasOf` another token, you specify that it is `computed` and then specify the inputs to that computation. In this case, the name of an existing `color` token, and a new `opacity` to apply to that color.

Unlike regular alias tokens, these computations can't be preserved in the output format. For example, in CSS, that token would be specified as a single `rgba()` value instead of something involving `calc()` or JavaScript.

## Name overrides

By default, when a token is exported, the name of the exported variable or property is derived from the token's name using the platform's common naming conventions. For example, `Global.Color.Blue` would be exported in CSS as `--global-color-blue`, but in WinUI as `GlobalColorBlue`. It's possible to override the exported name using `fullName`. Here's an example:

```json
{
	"Global": {
		"Color": {
			"Blue": { "value": "blue", "fullName": "MyBlueToken" },
		}
	}
}
```

In that example, the token would be exported to CSS as `--MyBlueToken` and WinUI as `MyBlueToken`. Since naming standards differ between platforms, name overrides are most useful as a platform override, described below.

Note that `fullName` only affects the token name when exported—when referring to it elsewhere in the JSON, you still use the original name. For example:

```json
"MyFavoriteColor": { "aliasOf": "Global.Color.Blue" }
/* NOT */
"MyFavoriteColor": { "aliasOf": "MyBlueToken" }
```

## Platform overrides

Occasionally one platform might need a different value for a token than other platforms. For example, maybe on the web and on Windows your search box uses a corner radius of 4 pixels, but on iOS you use 10 pixels to match the native search box. You can use a `platform` override to accomplish that.

```json
{
	"Search": {
		"Corner": {
			"Radius": {
				"value": 4,
				"platform": {
					"ios": {
						"value": 10
					}
				}
			}
		}
	}
```

`platform` can contain any of the following: `css`, `winui`, `ios`. Then, inside that, any valid token JSON, which is merged onto to the object containing `platform`, overwriting existing values if present. In this case, the `value: 10` overwrites the `value: 4` in `Search.Corner.Radius`, so when exporting for iOS that token will have a value of 10 pixels, and on all other platforms, it will have a value of 4 pixels.

There are a variety of examples of valid overrides in [`fluentui-overrides.json`](src/demo/fluentui-overrides.json).

## Value types

Values in token JSON are stored in a universal format very similar to CSS web standards, and then converted to the proper format and syntax for each platform that the pipeline exports to.

The pipeline infers the data type from the token's full name, *not* its value. So, **it's important to follow the naming scheme of existing tokens in the JSON**. You can see the code that handles this in [`fluentui-shared.ts`](src/pipeline/fluentui-shared.ts).

Tokens can represent any of the following value types:

### Colors

A color, with or without an alpha channel, in CSS syntax.

* `"#rrggbb"` or `"#rrggbbaa"`
* `"rgb(255, 255, 255)"` or `"rgba(255, 255, 255, 0.5)"` or `"hsl(206, 100%, 50%)"`
* `"transparent"` or `"white"` or `"black"`
* [High contrast system colors](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#system_colors): `"Canvas"`, `"CanvasText"`, `"LinkText"`, `"GrayText"`, `"Highlight"`, `"HighlightText"`, `"ButtonFace"`, or `"ButtonText"`

### Gradients

A linear gradient with any number of stops. You can specify a gradient anywhere that you can specify a color, though not every UI platform supports them in all of the same places. (For example, CSS doesn't support gradient strokes except using `border-image` which doesn't look exactly the same and doesn't support corner radii.)

```json
{
	"start": [0, 0],
	"end": [0, 1],
	"stops": [
		{ "position": 0, "value": "black" },
		{ "position": 1, "aliasOf": "Global.Color.White" }
	]
}
```

* `start` and `end`: The start and end points of the gradient, specified as numbers between 0 and 1 inclusive, as you would specify the gradient in [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient) or [XAML](https://docs.microsoft.com/en-us/windows/winui/api/microsoft.ui.xaml.media.lineargradientbrush).
	* See the table below if you're not familiar with specifying gradients in this way.
* `stops`: An array of gradient stops.
	* `position`: The position (or "offset") of the stop, specified as a number whose scale depends on `stopsUnits`:
		* `stopsUnits: undefined` (default): Between 0 and 1, where 0 is the start of the gradient and 1 is the end.
		* `stopsUnits: "pixels"`: Greater than or equal to 0, where 0 is the start of the gradient and positive numbers are a number of pixels from the start.
	* `value` or `aliasOf`: Any single valid color value, or an alias that resolves to a single valid color value.
* `stopsUnits`: Determines how `stops.position` values are interpreted.

If you're not used to specifying gradients with start and end points, here are the four most common values:

| Direction | CSS | `start` | `end` |
| --- | --- | --- | --- |
| Left to right | `to right` / `270deg` | `0, 0` | `1, 0` |
| Right to left | `to left` / `90deg` | `1, 0` | `0, 0` |
| Top to bottom | `to bottom` / `0deg` | `0, 0` | `0, 1` |
| Bottom to top | `to top` / `180deg` | `0, 1` | `0, 0` |

`start: [0, 0]` and `end: [0, 1]` can also be expressed as `start: [0.5, 0]` and `end: [0.5, 1]`: when one y-coordinate is 0 and the other is 1, the x-coordinates are irrelevant as long as they're the same value, and vice-versa.

### Color ramps

You can also specify an entire color ramp from a single base color value. Instead of:

```json
{
	"Color": {
		"Grey": {
			"2": { "value": "#050505" },
			"4": { "value": "#0a0a0a" },
			"98": { "value": "#fafafa" }
		}
	}
}
```

...you can just specify a base color and a color ramp algorithm:

```json
{
	"Color": {
		"Grey": {
			"generate": { "type": "lightness2to98by2", "value": "#808080" }
		}
	}
}
```

These color ramp algorithms are supported:

| `type` | Description |
| --- | --- |
| `lightness2to98by2` | Produces a color ramp with values `2`, `4`, ... `98`, where each color differs only by HSL lightness value. `2` will be a shade above black, `98` will be a shade below white, and the values in-between will be different shades of the base color. |
| `fluentsharedcolors` | Produces a color ramp with `Primary` as the base color, five darker shades as `Shade10` through `Shade50`, and six lighter tints as `Tint10` through `Tint60`. |

**Important:** `value` must be a single color, not a gradient or alias of another token.

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

### Font letter spacing

Letter spacing (aka character spacing or tracking) is specified in ems (not pixels) **without units**.

**Except for Swift**, where the values are specified in points without units instead. (This means that you'll need to use platform-specific overrides to use a single source JSON file to export to both Swift and at least one other platform.)

* `-0.02`
* <strike>**not** `"-0.02em"`</strike>

### Line spacing

Line spacing (aka leading) is specified in device-independent pixels (not multiples or percentages) **without units**.

* `20`
* <strike>**not** `"20px"`</strike>

### Widths and heights and spacing

Element widths and heights and spacing values are specifed as independent properties in device-independent pixels **without units**.

* `80`
* <strike>**not** `"80px"`</strike>
* <strike>**not** `"1024 768"`</strike>

### Shadows

Shadows are specified as an array of individual shadows, each with their own offsets, sizes, and colors (including opacity).

```json
[
	{ "x": 0, "y": 0, "blur": 2, "color": { "value": "#00000022" }},
	{ "x": 0, "y": 1, "blur": 2, "color": { "aliasOf": "Global.Color.ShadowKey" }}
]
```

X- and Y-offsets and the blur amount are specified in device-independent pixels **without units**, and correspond to the values you would use for the CSS `box-shadow` property (even if your platform defines shadows in a slightly different way, such as SwiftUI, which uses different values for blur amounts). The color of the darkest point of the shadow can be specified either with `value` or `aliasOf`. You will probably want to use a color with an alpha value less than 1. Each shadow can have a single color, not a gradient.

You can specify any number of shadows for an element, which will be applied in the same manner as the CSS `box-shadow` property.

Not all platforms support shadows defined in this way. For example, WinUI `ThemeShadow` defines shadows based on a Z-axis offset rather than explicit X- and Y-offsets and a blur amount. In unsupported platforms, these tokens are not exported.

### Stroke alignments

Stroke alignments are specified as either inner or outer. They translate to the `background-clip` property in CSS and the `BackgroundSizing` property in WinUI, and they're used for specifying how to draw a partially-transparent border.

* `"inner"`: The stroke is drawn inside the edge of the control on top of the control's fill. Best for most situations.
* `"outer"`: The stroke is drawn outside the control's fill on top of the content behind the control.

| Stroke alignment | CSS | WinUI |
| --- | --- | --- |
| `"inner"` | `background-clip: border-box` | `BackgroundSizing="OuterBorderEdge"` |
| `"outer"` | `background-clip: padding-box` | `BackgroundSizing="InnerBorderEdge"` |

Note that stroke alignment doesn't actually affect the sizing of the element, and is different from `border-box` in CSS. It's also intentional that, for example, `"inner"` specifies `OuterBorderEdge` in WinUI: the token value represents the stroke, but the UI platform property represents the fill, so the terminology is roughly reversed.

## Versioning and validation

Token JSON files must start with the following:

```json
{
	"$schema": "https://raw.githubusercontent.com/microsoft/fluentui-token-pipeline/main/docs/token.schema.json",
	"Meta": {
		"FluentUITokensVersion": 0
	}
}
```

* The `$schema` property tells your text editor where to find the schema for token JSON, which will help you validate your tokens before running them through the pipeline.
* The `Meta.FluentUITokensVersion` property indicates that your token JSON was created for use with this version of the pipeline and could be used in the future for compatibility.
	* If this property is not present, the token file will be assumed to be in the DTCG format instead of the format described here.

### Validation errors in Visual Studio Code

With `$schema` at the top of your JSON, Visual Studio Code will automatically validate your token JSON files as you type. Be aware that, due to the complexity and flexibility of this format, the actual *errors* reported by Visual Studio Code can be very misleading. For example, if you mistype `value` as `valeu`, VSCode will report that you're missing the required property `aliasOf`. Use the validation to help find errors, but take the error text with a grain of salt.

In particular, VSCode's ability to validate platform overrides is limited, especially if you intend on combining multiple JSON files. Errors reported in complex platform override scenarios may be false positives.
