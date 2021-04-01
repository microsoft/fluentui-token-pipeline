---
title: Integration with the pipeline
---

🏠 [Home](./)

# I'm an engineer and someone told me I had to integrate with this pipeline thing.

You're in the right place! First question: are you working on one of the Fluent UI libraries for Microsoft?

**If yes:** Great! Keep reading, and I'll help you get going.

**If no:** Great! We're glad you're excited. This project's still in the early stages right now, though, and we'd like to build out a couple of end-to-end workflows and tidy up a bit before adding any official third-party support. But feel free to keep watching this space, and we'll try to be transparent about how things are progressing.

(By the way, "I" in this document is Travis Spomer. If you answered "Yes" to that question, you can find me on Teams.)

## Where should I get started?

It's probably useful to get familiar with a few things first. Here's what I'd recommend:

1. [Clone and build this repo](build.md).
2. Try transforming some tokens.
	* You can use `npm run transform` in this repo to transform the `src/demo/fluentui.json` sample file, which is probably good enough for now.
	* If you got a separate JSON from a PM or a designer and want to try that instead, you can use the [CLI](cli.md). (`transform` uses the same thing under the hood; it's just a convenience.)
	* After transforming the tokens, look in the `build` folder to inspect what got generated: there are multiple folders containing various files. The most interesting are probably [`build/reference/index.html`](../build/reference/index.html) and [`build/json/tokens-controls.json`](../build/json/tokens-controls.json).
3. Dive into the [JSON format reference](json.md). (You can probably stop once you get to the "Value types" section.) Open it side-by-side with the [demo JSON](../src/demo/fluentui.json).

Feel free to ask if you have any questions—you're probably one of the very first people to read this documentation, so it could probably use some polish. Once you're done with that, you should hopefully have a basic understanding of how the JSON format is set up, and the different types of tokens. If you'd like to see the tokens in action, you can open the demo pages in `src/demo/web`.

## So where do I fit in?

Okay, now let's clarify how tokens will get into UI libraries when this is all done.

1. First, **designers** will produce the token JSON, like that `fluentui.json` demo file you saw. In most cases they'll be using a Figma plugin to *generate* that file: they likely won't be hand-editing it. But they could. The design teams are responsible for:
	* Building and organizing the design system of colors, font sizes, corner radii, and so on.
	* Maintaining consistent naming of tokens, parts, and terminology. Names won't be 100% consistent across all products and teams at the start, but we've agreed on a set of common terms so that we can get closer over time.
	* Mapping the important parts of each control to the appropriate tokens: essentially, producing a spec for the control in JSON form. For example, they might specify that `ButtonPrimary`'s `Icon` `Fill Color` when at `Rest` should be taken from the set `NeutralForegroundInvertedAccessible`.
2. Then, that JSON gets run through the **pipeline** (the tool produced by this repo). The original JSON might live in a GitHub repo that automatically runs the pipeline whenever the JSON changes, or maybe at first someone is manually running the `transform-tokens` CLI tool.
3. The pipeline produces **code** from the original token JSON.
4. That code either gets built into a versioned NPM or NuGet package and consumed automatically by the UI library, or someone manually moves the pipeline output into the UI library code and commits it.

Eventually, once the necessary pieces are built, a designer could push a color change into the UI library with no input from a developer at all, beyond possibly updating a package version. No more manual updates from component specs and redlines and such.

### Uh-huh. What's the catch?

Well, the catch is that someone has to build the last parts of that process. That's where you come in.

## Where do I start?

Let's start by getting things working manually, without the automated processes, since those can happen later. You can start by hooking up a button control to the tokens from the pipeline.

First, think about this question: 

> In a perfect world, if you could have design specs come to you already in code so you could do as little manual work as possible, what format would that be in?

If you're dealing with a web platform, maybe you want CSS variables, or maybe you use CSS-in-JS and you just want some JSON objects. Then, every place in your button control where you hard-coded a design decision, or got it from some other theming infrastructure you created, you could just reference the CSS variables or JSON objects. Or, if you're dealing with WinUI, maybe you just want a XAML file containing a `ResourceDictionary` full of `StaticResource` definitions. Each platform (or even each UI library on the same platform) will want this data in a slightly different way.

The good news is that almost all of the steps needed to make that perfect world a reality are either done or will be happening: all you need to do is write some JavaScript that turns the data into that perfect format you imagined, *and* I'm here to help you get that going. In fact, I've already put together some proofs-of-concept. Let's say for now that you're working on a web UI library that uses CSS-in-JS—now, open `build/json/tokens-controls.json` and look at what got built. (I'm assuming you ran `npm run build` and `npm run transform` as suggested above.)

At the very top of that JSON file you'll see a node `"button"`, and beneath that you'll see a bunch of properties and values: a bunch of colors for different states, a corner radius, font properties, and so on. (Note that this *built* JSON is in a much simpler format than the *original* token JSON!) There should be enough information in there to replace almost every hard-coded design decision in the control. (There are a few exceptions: for a counterexample, layout is something that design hasn't tackled yet.) You could `import` `button` from that JSON file into your control and start using it from your code right away. It should be clear what each one of those tokens refers to—the tokens all follow a consistent naming scheme.

But, remember: the output format can be whatever your library needs it to be—you're not limited to what the pipeline builds today. For example, `tokens-controls.json` currently groups things by control (or control variant) and then "flattens" everything inside. Maybe you want the icon-related properties to be under their own `icon` node. Maybe you want colors in eight-digit hex without a `#`. Or maybe the rest/hover/pressed/disabled versions of the stroke color should be together in their own object. Or maybe you want it in YAML instead of JSON. Any of that's fine: **you just need to figure out what your format requirements are,** and you can work with me to update the code. (Hint: all of the export-related code is in `src/pipeline`.)

### What if I need to do something really complex?

It's possible that you might want to do something complex and specific with the token data and it feels like it makes more sense to do it as a build step in your own repo. That's possible too—in that case, you can have the pipeline just output JSON or XML or YAML or some other intermediary format, import that file into your repo's build process, and then do the final steps *there* to produce the version of the output that you actually use in your controls. (For example, if you have some kind of user theming support that you need to maintain and you've already had to build something similar to this pipeline in your codebase, it's probably easier to do that rather than try to move or copy a large amount of existing code to this repo.)

### Any caveats I should know about?

Besides the point I mentioned earlier about how a few things like control layout haven't been "tokenized" yet, there are a couple of things to keep in mind:

* Right now you're probably working with that demo JSON that doesn't have every property of every control defined yet, **or** it has the properties defined but they're placeholder values (like all colors in magenta).
* Some of the names of things are subject to change while we get these first end-to-end workflows set up. **Once we get to v1, designers realize that name changes are breaking changes,** so that's not a long-term problem you need to worry about.

That shouldn't block you from progressing. (If you feel that it does, let me know and I'll see what I can do to help you out.)

### Hmmm, this isn't really how I think theming and token mapping should work.

If the *kind* of data you're getting from the pipeline isn't really in a format that feels useful to you, let us know. For example, it might be that using these mappings in this way might not easily be compatible with existing theming infrastructure you've already built for past versions. I'd recommend giving it a try if for no other reason than the huge value in designers having a way to get designs directly into code without *writing* that code. But, if you find that what you really need is just the alias tokens or global tokens, you can certainly get that data out of the pipeline as well. (Typically those are "private" implementation details of the system, so that designers can reorganize the tokens and design system however they want without breaking platform code, but as long as engineering and design are on the same page, you can use tokens at those other levels too.)

For example, in the demo JSON, all four of these are the same value:

* `Button.Icon.Fill.Color.Rest`—this is the one that I recommend using
* `NeutralForeground1.Fill.Color.Rest`—but the Button token points at this one, so you *could* use it too
* `Global.Color.Grey.14`—NeutralForeground1 points at this global token in the grey color ramp, but you probably shouldn't use this in code
* `#242424`—is the underling value for that token in the grey ramp, which you *definitely* shouldn't use in code

If you choose to use tokens like `NeutralForeground1...` in code:

* Design needs to know that you've taken that dependency so they don't rename it
* Multiple controls in your library will use the same token, instead of each having their own token
* Designers will need you to make manual code changes whenever they want to switch to `NeutralForeground2` colors, instead of having everything happen automatically

The `Global` tokens should very rarely be used in code directly, but there are some edge cases where they might be useful:

* Color pickers might want to offer a nice global set of colors that don't have any particular semantic meaning
* Your UI library might itself export certain colors from the design system for apps that build on your platform to use in custom controls

### What about light mode and dark mode?

Good question! Ultimately that's going to come down to you and your designers. We expect that you'll have at least two separate token JSON files: a base/light theme file, and then a dark theme file that either is completely separate, or just overrides certain tokens in the base file. The pipeline hasn't taken a specific stance on theming since some products have more than two themes, and each UI platform handles light and dark mode switches in a different way. This is something you'll also need to keep in mind when designing how you want to get token data from the pipeline.

### Where did the alias tokens go?

Many of the pipeline's output formats strip all hierarchy from the tokens, so all that's left are the raw values. But it's also possible that you want to *keep* that hierarchy. Take a look at `build/web/tokens.css`: that file turns all tokens into CSS variables, and many of them refer to other variables. Using the example of `Button.Icon.Fill.Color.Rest`, `tokens.css` produces the following:

```css
--button-icon-fill-color-rest: var(--neutralforeground1-fill-color-rest);
--neutralforeground1-fill-color-rest: var(--global-color-grey-14);
--global-color-grey-14: #242424;
```

There's also a `tokens-flat.css` file in the same folder that uses `#242424` directly for all three variables.

The main advantage of preserving that hierarchy is the ability to change things at runtime. For example, you could have multiple "grey" ramps, and give the user a choice between a warmer grey palette and a cooler grey palette. In that case, you might redefine `--global-color-grey-14` at runtime: if you preserve the token hierarchy in your export like in the `tokens.css` example, the button control using `--button-icon-fill-color-rest` would automatically update its icon color whenever you alter the grey colors.

## So what was that about automating this stuff...?

Once you've got the process working manually for at least one control, you can start looking into automating this process. The specifics of what exactly you need to do will depend on how you want to organize tokens for your project, but I've put together [an example repo that might help](https://github.com/TravisSpomer/fluentui-token-repo-example). That repo includes a token JSON file with just one token in it. Whenever someone changes that file, a GitHub Actions workflow starts that:

1. Processes the tokens to produce all of the defined code outputs (JSON, CSS, WinUI, etc.)
2. Saves all of the outputs as a build artifact
3. Packages all of that into an NPM package and publishes it
4. Produces a human-readable token reference page on GitHub Pages
