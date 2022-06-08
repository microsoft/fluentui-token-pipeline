---
title: Token naming reference
---

🏠 [Home](./)

# Token naming reference

## Definitions

Our design tokens follow a consistent taxonomy and naming system. To understand it, first, a few definitions:

* At the core are your **global tokens**, which contain all of the different values in your design system: colors, sizes, typography, and more. They have very specific names and no particular meaning. For example, "blue #60" would be a global token, such as `Global.Color.Blue.60`.
	* As a general rule, global tokens always have an explicit value and don't refer to any other token. Exceptions are permitted, however, for cases such as:
		* `Global.Color.Accent.60` that just shares its value with `Global.Color.Blue.60`
		* A global shadow token that gets its fill color from another global token
* **Alias tokens** give semantic meaning to those raw values. For example, if design dictates that a control that performs an action that is accent-colored should have a background fill color when hovered as blue #60, they might set `Set.AccentActionControl.Fill.Color.Hover` to be an *alias* of `Global.Color.Blue.60`.
	* Alias tokens always get their value from another token.
	* The prefix `Set.` is used in the token JSON but is always omitted when referring to that token elsewhere.
* **Token sets** are just groups of alias tokens that can be reused for convenience and consistency. For example, `Set.AccentActionControl.Fill.Color` could be a set that defines `.Rest`, `.Hover`, `.Pressed`, and `.Disabled` colors for that same part of the same type of control. Instead of explicitly setting `ActionButton.Base.Fill.Color.Rest` to `AccentActionControl.Fill.Color.Rest`, `ActionButton.Base.Fill.Color.Hover` to `AccentActionControl.Fill.Color.Hover`, and so on, you can just set `ActionButton.Base.Fill.Color` to the whole `AccentActionControl.Fill.Color` set. It's exactly equivalent, just simpler.
* Finally, controls in your UI platform of choice get their default styling values from **control mappings**, also known as **control tokens**. For example, an accent-colored button's base (background) element's fill color when hovered should be set to `AccentButton.Base.Fill.Color.Hover`.

It's worth noting that token sets and control mappings are not currently used by our token system, but they're supported for use in the future. For now, you'll just see global tokens and alias tokens.

Token names are split up by dots (`.`), but sometimes people write them with a hyphen (`-`) instead.

Finally, each UI platform (Fluent UI React for Web, Fluent UI React Native, WinUI, etc.) transforms token names into what makes the most sense for that platform's codebase. So `Global.Color.Blue.60` might appear as `colorBlue60` in code. Those transformed names aren't referenced here and are only relevant to people working in that codebase.

## The rules

### Prefix

1. All global tokens should have a name that starts with `Global`.
	* Example: `Global.Color.Berry.Primary`
2. All alias tokens should have a name that starts with `Set` in the JSON file, though we typically omit that when talking about the token.
	* Example: `Set.NeutralForeground1.Fill.Color.Rest` (`NeutralForeground1.Fill.Color.Rest`)
3. Control mappings should never have a prefix.
	* Example: `AccentButton.Base.Fill.Color.Rest`

The rest of the name depends on the type of token. The naming system is designed so that, roughly speaking, you can describe everything you need to know about when to use a token by putting its parts into a fill-in-the-blanks sentence.

### Global tokens

Global token names have the most flexible format:

1. `Global`
2. Type of thing (can be a single word, or a pair of words if useful for grouping)
3. Name of thing (can be a single word, or a pair of words/numbers if useful for grouping)

"The **(2)** named **(3)**."

* `Global.Color.Cranberry.Shade20`: The **color** named **Cranberry Shade20**.
* `Global.Color.White`: The **color** named **White**.
* `Global.Font.Family.Base`: The **font family** named **Base**.
* `Global.Font.Size.400`: The **font size** named **400**.

### Alias tokens

Alias token names are a bit more restrictive:

1. `Set`
2. Name of thing (or token set)
3. Part of that thing
4. Property of that part
5. Interaction state (if appropriate)

"Things using the token set **(2)** have a **(3)** that should have this **(4)** \[when **(5)**\]."

* `Set.NeutralForeground1.Fill.Color.Rest`: Things using the token set **NeutralForeground1** have a **fill** that should have this **color** when **at rest**.
* `Set.NeutralStroke1.Stroke.Color.Hover`: Things using the token set **NeutralStroke1** have a **stroke** that should have this **color** when **hovered**.
* `Set.NeutralStroke1.Stroke.Width`: Things using the token set **NeutralStroke1** have a **stroke** that should have this **width** regardless of interaction state.
* `Set.Title1.Font.Family`: Things using the token set **Title1** have a **font** with this **font family** regardless of interaction state.

Remember that we almost always leave off the word "Set" when referring to these tokens, but it's not optional in the token JSON file itself.

### Control mappings

Control mapping names follow a very similar scheme as alias token names, but don't include the word `Set` and instead have an extra word that specifies the specific element of the control being described.

1. Name of control (or control variant)
2. Element of the control
3. Part of that element
4. Property of that part
5. Interaction state (if appropriate)

"A **(1)** has a **(2)** and its **(3)** should be this **(4)** \[when **(5)**\]."

* `ButtonPrimary.Base.Fill.Color.Rest`: A **button** (using the **primary** variant) has a **base** (face) and its **fill** should be this **color** when **at rest**.
* `Button.Content.Font.Family`: A **button** (using its default variant) has **content** (text) and its **font** should be this **family** regardless of interaction state.
* `Button.Content.Fill.Color.Hover`: A **button** (using its default variant) has **content** (text) and its **fill** should be this **color** when **hovered**.

## Allowed words

### Prefix

* `Global` for global tokens.
* `Set` for alias tokens and token sets.

### Elements

* `Base` for the most obvious part of the control, like a button's face, if there's no better name.
* `Content` for the main content of the control, usually text.
* Any other words are acceptable here. A checkbox might have `Box` and `Check`, for example, and a slider might have `Thumb`, `Track`, and `Ticks`.

### Parts and properties

* `Fill` for fills (backgrounds, text, icons).
	* `Color` for the fill color or gradient.
* `Stroke` for strokes (borders).
	* `Color` for the stroke color.
	* `Width` for the stroke width.
	* `Alignment` for the stroke alignment.
* `Font` groups font properties.
	* `Family` for the font family.
	* `Size` for the font size.
	* `Weight` for the font weight.
	* `LineHeight` for the line height (leading).
* `Shadow` for shadow definitions.
	* A single shadow token can contain multiple shadow definitions, each with their own properties and colors, but those individual properties don't have their own token names.
* `Corner` groups corner properties.
	* `Radius` for the corner radius.
* `Layout` groups width and height.
	* `Width` for the control width.
	* `Height` for the control height.
* `Padding` for a padding value.
* `Spacing` for a spacing value.

### Interaction states

* `Rest`
* `Hover`
* `Pressed`
* `Disabled`

You can also prefix the four core interaction states with another state, such as `Selected`.

Other interaction states are allowed, and our token naming is sometimes inconsistent here. For example, you might find `Selected` used as a single interaction state even though it doesn't really fit there since a control's selected/checked state is independent of whether it's hovered, pressed, disabled, or neither. The preferred set of states for a control that can be selected/checked is:

* `Rest`
* `Hover`
* `Pressed`
* `Disabled`
* `Selected.Rest`
* `Selected.Hover`
* `Selected.Pressed`
* `Selected.Disabled`
